import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
// typescript 7 (tsgo) exposes the compiler API only under unstable/; pinned exactly in the root package.json: revisit on any TypeScript bump.
import { API, SignatureKind, SymbolFlags, type Checker, type Program, type Symbol as ApiSymbol, type Type } from 'typescript/unstable/sync';
import {
  SyntaxKind,
  isBindingElement,
  isLiteralTypeNode,
  isObjectBindingPattern,
  isTypeAliasDeclaration,
  isTypeReferenceNode,
  isUnionTypeNode,
  isVariableStatement,
  type Node,
  type TypeNode,
} from 'typescript/unstable/ast';
import { findRoot, loadData, type Data, type Manifest, type ManifestComponent, type ManifestProp } from './data.js';
import { listTokens, type TokenEntry, type TypographyValue } from './tools.js';

// The spec §4 proof-screen table, copied here so the generator has no runtime
// dependency on the spec document.
const PROOF_SCREENS: Record<string, string> = {
  Sentence: 'Lugeja',
  Bubble: 'Lugeja, ⌥ held',
  Dial: 'Lugeja, Skeemid',
  Keycap: 'Everywhere',
  Button: 'Everywhere',
  Tile: 'Eksam, Kordamine, Koosta',
  Progress: 'Everywhere',
  Bar: 'Täna, tulemus',
  Cell: 'Õigused',
  Nav: 'Everywhere',
  TileStack: 'Eksam',
  CellGrid: 'Õigused',
  usePeek: 'Lugeja',
  Term: 'Lugeja, Skeemid',
  TermText: 'Skeemid',
};

// A container carries the rules of what it holds: an agent that asks for
// TileStack alone must still be told how tiles behave in it.
const TILE_RULES = [
  'Options stack vertically in a TileStack, never in a row, except the two of a true/false item.',
  'Options run to 40 characters.',
];
const CELL_RULES = ['Rows Igaüks / Eesti kodanik, columns Tohib piirata / Ei tohi piirata; keys 1–4.'];

// Per-component usage rules, English. Components not listed here have no rules of their own.
const RULES_BY_COMPONENT: Record<string, string[]> = {
  Button: [
    'Every control shows its key: pass keycap whenever there is one.',
    'filled is the one primary action on a screen.',
    'Disabled controls never hover.',
  ],
  Tile: TILE_RULES,
  TileStack: TILE_RULES,
  Sentence: [
    'The English pair (text + note) is required together: the note says the translation is unofficial.',
    'Term ids that repeat pin together.',
  ],
  Term: [
    'The line sits 4 px under the letters at both sizes.',
    'Body size keeps the paragraph font; reading size is the content font.',
    'Unmarked terms (Eesti keeles) still open on click.',
  ],
  TermText: [
    "Renders inline with no element of its own: put it inside the caller's <p> or <li>.",
    'Term ids that repeat pin together.',
    'At body size the caller need not clip; the bubble stays in view.',
    'Pass live={false} inside a container that is already a live region.',
  ],
  Nav: ['Chrome stays Estonian; while peeking it swaps to English and never gains a subtitle.'],
  Cell: CELL_RULES,
  CellGrid: CELL_RULES,
  Bubble: [
    'Sits above its word; the count is decorative to assistive technology.',
    'At body size it wraps and shifts sideways to stay inside its clipping box; the tail stays over the word.',
  ],
  Dial: ['The exam disables it as one control.'],
  Progress: ['One segment per unit; the counts are given in words.'],
  Bar: ['One segment per unit; the counts are given in words.'],
};

// The system-wide rules every component obeys, regardless of what it is.
const SYSTEM_RULES: string[] = [
  'Use only token utilities: the Tailwind theme is closed, so bg-red-500 or p-11 do not exist.',
  'Two fonts only: font-content (Source Serif 4) for what is being learned, font-chrome (Instrument Sans) for the app.',
  'Type is used through the roles (label, body, title, reading, headline, display, and reading-narrow / headline-narrow below 640px), never a size number.',
  'Contrast is a gate: every text pair 4.5:1, every graphic pair 3:1, in both modes.',
  'Hit targets are at least 44px.',
  'Every interactive element has a visible focus ring; disabled never hovers.',
];

type FigmaLedger = {
  fileUrl: string;
  components?: Record<string, { setId?: string; componentId?: string }>;
};

function samePath(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Resolves a type annotation to the source text of a literal union, following
 * simple (non-generic) type-alias references up to a few hops, e.g.
 * `state?: TileState` where `TileState = SurfaceState` and `SurfaceState` is
 * itself the union. Returns `undefined` when the annotation isn't (or does
 * not lead to) a union purely of literal types, so the caller can fall back
 * to `checker.typeToString`.
 */
function literalUnionText(checker: Checker, annotation: TypeNode | undefined): string | undefined {
  let node: Node | undefined = annotation;
  for (let hop = 0; node && hop < 6; hop++) {
    if (isUnionTypeNode(node) && node.types.every((t) => isLiteralTypeNode(t))) {
      return node.getText().trim();
    }
    if (isTypeReferenceNode(node) && (!node.typeArguments || node.typeArguments.length === 0)) {
      const type = checker.getTypeFromTypeNode(node);
      const aliasSymbol = type?.getAliasSymbol();
      const decl = aliasSymbol?.declarations[0]?.resolve();
      if (decl && isTypeAliasDeclaration(decl)) {
        node = decl.type;
        continue;
      }
    }
    break;
  }
  return undefined;
}

/**
 * The type string for a prop: a literal union is expanded (`ButtonVariant` → `'filled' | 'outline' |
 * 'dim'`), following simple alias hops as `literalUnionText` does; anything else prints as written
 * in the property's own annotation, e.g. `ReactNode` rather than `ReactNode`'s expansion, which
 * `checker.typeToString` gives for a *union* alias only when nothing forces it to rebuild the type
 * (an optional property's `NonNullable` does). Falls back to `checker.typeToString(fallback)` on the
 * rare property with no parseable annotation node.
 */
function propTypeText(checker: Checker, annotation: TypeNode | undefined, fallback: Type): string {
  if (!annotation) return checker.typeToString(fallback);
  return literalUnionText(checker, annotation) ?? annotation.getText().trim();
}

/** Collects `variant = 'filled'`-style defaults from a destructured parameter, keyed by prop name. */
function collectDefaults(paramSymbol: ApiSymbol): Map<string, string> {
  const defaults = new Map<string, string>();
  const paramDecl = paramSymbol.declarations[0]?.resolve();
  const pattern = paramDecl && 'name' in paramDecl ? (paramDecl as { name?: Node }).name : undefined;
  if (!pattern || !isObjectBindingPattern(pattern)) return defaults;
  for (const element of pattern.elements) {
    if (!isBindingElement(element) || !element.name || element.dotDotDotToken) continue;
    if (element.initializer) defaults.set(element.name.getText(), element.initializer.getText());
  }
  return defaults;
}

/** The named exports of `<Dir>/<Dir>.stories.tsx`, in declaration order; `[]` when there is no story file. */
function getStates(program: Program, componentFileName: string): string[] {
  const dir = dirname(componentFileName);
  const storyFileName = join(dir, `${basename(dir)}.stories.tsx`);
  const storySource = program.getSourceFile(storyFileName);
  if (!storySource) return [];
  const names: string[] = [];
  for (const statement of storySource.statements) {
    if (!isVariableStatement(statement)) continue;
    const isExported = (statement.modifiers ?? []).some((m) => m.kind === SyntaxKind.ExportKeyword);
    if (!isExported) continue;
    for (const decl of statement.declarationList.declarations) {
      names.push(decl.name.getText());
    }
  }
  return names;
}

function getFigma(figma: FigmaLedger, name: string): ManifestComponent['figma'] {
  const entry = figma.components?.[name];
  if (!entry) return undefined;
  const result: { setId?: string; componentId?: string; file: string } = { file: figma.fileUrl };
  if (entry.setId) result.setId = entry.setId;
  if (entry.componentId) result.componentId = entry.componentId;
  return result;
}

function buildComponent(checker: Checker, program: Program, root: string, figma: FigmaLedger, exported: ApiSymbol): ManifestComponent {
  const name = exported.name;
  const kind: ManifestComponent['kind'] = name.startsWith('use') ? 'hook' : 'component';
  const aliased = checker.getAliasedSymbol(exported);
  const declarationNode = aliased.declarations[0]?.resolve();
  if (!declarationNode) throw new Error(`lause-ds-mcp: ${name} has no resolvable declaration`);
  const componentFileName = declarationNode.getSourceFile().fileName;
  const source = relative(root, componentFileName);
  const summary = checker.getDocumentationCommentOfSymbol(aliased);

  const functionType = checker.getTypeOfSymbol(aliased)!;
  const signature = checker.getSignaturesOfType(functionType, SignatureKind.Call)[0];
  const params = signature?.getParameters() ?? [];
  const paramSymbol = params[0];

  const props: ManifestProp[] = [];
  if (paramSymbol) {
    const paramType = checker.getTypeOfSymbol(paramSymbol)!;
    const defaults = collectDefaults(paramSymbol);
    for (const propSymbol of checker.getPropertiesOfType(paramType)) {
      const isOwnProp = propSymbol.declarations.some((d) => samePath(d.path, componentFileName));
      if (!isOwnProp) continue;
      const propDecl = propSymbol.declarations.find((d) => samePath(d.path, componentFileName))!.resolve();
      const annotation = propDecl && 'type' in propDecl ? (propDecl as { type?: TypeNode }).type : undefined;
      const required = !(propSymbol.flags & SymbolFlags.Optional);
      const rawType = checker.getTypeOfSymbol(propSymbol)!;
      const finalType = required ? rawType : checker.getNonNullableType(rawType) ?? rawType;
      const type = propTypeText(checker, annotation, finalType);
      const prop: ManifestProp = {
        name: propSymbol.name,
        type,
        required,
        doc: checker.getDocumentationCommentOfSymbol(propSymbol),
      };
      const defaultValue = defaults.get(propSymbol.name);
      if (defaultValue !== undefined) prop.default = defaultValue;
      props.push(prop);
    }
  }

  const states = kind === 'hook' ? [] : getStates(program, componentFileName);

  return {
    name,
    kind,
    source,
    summary,
    props,
    states,
    proofScreen: PROOF_SCREENS[name] ?? '',
    figma: getFigma(figma, name),
    rules: RULES_BY_COMPONENT[name] ?? [],
  };
}

/** Builds the manifest by reading `packages/ui/src` with the TypeScript compiler API. */
export function generateManifest(root: string): Manifest {
  const uiRoot = join(root, 'packages/ui');
  const tsconfigPath = join(uiRoot, 'tsconfig.json');
  const indexPath = join(uiRoot, 'src/index.ts');
  const figma = JSON.parse(readFileSync(join(root, 'figma/library.json'), 'utf8')) as FigmaLedger;

  const api = new API();
  try {
    const snapshot = api.updateSnapshot({ openProjects: [tsconfigPath] });
    const project = snapshot.getProject(tsconfigPath);
    if (!project) throw new Error(`lause-ds-mcp: could not open ${tsconfigPath}`);
    const { program, checker } = project;
    const sourceFile = program.getSourceFile(indexPath);
    if (!sourceFile) throw new Error(`lause-ds-mcp: ${indexPath} is not part of the ui program`);
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile as unknown as Node);
    if (!moduleSymbol) throw new Error('lause-ds-mcp: packages/ui/src/index.ts has no module symbol');

    const components: ManifestComponent[] = [];
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const aliased = checker.getAliasedSymbol(exported);
      if (!(aliased.flags & SymbolFlags.Function)) continue; // a type export, not a component or hook
      components.push(buildComponent(checker, program, root, figma, exported));
    }

    return {
      generatedFrom: {
        inputs: [
          'packages/ui/src/index.ts',
          'packages/ui/src/**/*.tsx',
          'packages/ui/src/**/*.stories.tsx',
          'figma/library.json',
          'docs/specs/2026-09-03-lause-ds-design.md',
        ],
      },
      components,
      rules: SYSTEM_RULES,
    };
  } finally {
    api.close();
  }
}

function renderProp(prop: ManifestProp): string {
  const optional = prop.required ? '' : '?';
  const withDefault = prop.default !== undefined ? ` = ${prop.default}` : '';
  // A prop's doc text is often itself a colon-delimited list of the enum values (`filled: ...
  // outline: ...`), and a union type carries its own ` | ` already. Wrapping the type (and its
  // default, if any) in backticks gives the boundary a structural marker instead of a guessed
  // separator: a parser reads the type as the text between the first backtick and the next, then
  // the doc text, if there is any, after the ` | ` that follows the closing backtick.
  const withDoc = prop.doc ? ` | ${prop.doc}` : '';
  return `- ${prop.name}${optional}: \`${prop.type}${withDefault}\`${withDoc}`;
}

function renderComponent(component: ManifestComponent): string {
  const lines = [`### ${component.name}`, '', component.summary];
  if (component.props.length > 0) {
    lines.push('', '#### Props', ...component.props.map(renderProp));
  }
  if (component.states.length > 0) {
    lines.push('', `States: ${component.states.join(', ')}`);
  }
  if (component.rules.length > 0) {
    lines.push('', '#### Rules', ...component.rules.map((rule) => `- ${rule}`));
  }
  lines.push('', `Source: ${component.source}`);
  if (component.figma) {
    const ref = component.figma.setId ? `set ${component.figma.setId}` : `component ${component.figma.componentId}`;
    lines.push(`Figma: ${component.figma.file} (${ref})`);
  }
  return lines.join('\n');
}

/** A typography role prints its whole ramp; everything else is already a string. */
function renderTokenValue(value: string | TypographyValue): string {
  if (typeof value === 'string') return value;
  return `fontFamily ${value.fontFamily}, fontSize ${value.fontSize}, lineHeight ${value.lineHeight}, fontWeight ${value.fontWeight}`;
}

/** The utilities a token is reached through: a colour is both a background and a text colour. */
function renderUtilities(entry: TokenEntry): string {
  return entry.type === 'color' ? `bg-${entry.tailwind} / text-${entry.tailwind}` : entry.tailwind;
}

/**
 * One token per line, in the form a reader can act on without a second
 * lookup: the resolved value in both modes, then the Tailwind utility and
 * the CSS custom property, then what the token is for. The values, the
 * utility keys and the custom properties all come from `listTokens`, the
 * same mapping the `list_tokens` tool serves, not a second copy of it.
 */
function renderTokenLine(entry: TokenEntry): string {
  const light = renderTokenValue(entry.light);
  const dark = renderTokenValue(entry.dark);
  const description = entry.description ? ` | ${entry.description}` : '';
  return `${entry.name}: ${light} (light) · ${dark} (dark) | ${renderUtilities(entry)} · ${entry.css}${description}`;
}

const INSTALL_SECTION = [
  '## Install and import',
  '',
  '`lause-ds` requires Tailwind v4 in the consuming app.',
  '',
  '```bash',
  'npm install lause-ds',
  '```',
  '',
  'In your Tailwind CSS entry (for example `app/globals.css`), in this order:',
  '',
  '```css',
  "@import 'tailwindcss';",
  "@import 'lause-ds/styles.css';            /* tokens + the theme; must live here, not in a TSX file */",
  "@source '../node_modules/lause-ds/dist';  /* relative to THIS css file; adjust for src/app/globals.css */",
  '```',
  '',
  'Then import components normally:',
  '',
  '```tsx',
  "import { Button, Dial, Tile, TileStack } from 'lause-ds';",
  '```',
  '',
  "Every component already carries `'use client'`, so it works as it is in a React Server Components app. " +
    'Load Source Serif 4 and Instrument Sans yourself (Google Fonts, or self-hosted).',
  '',
  'To style a plain element the same way the components do, import the shared style constants: ' +
    '`focusRing`, `disabledControl`, `hitTarget`, `hoverFade`, and the `SurfaceState` type ' +
    "(`'idle' | 'selected' | 'filled' | 'dimmed'`) behind `Tile` and `Cell`.",
];

/** Renders `llms.txt`: the tokens and components an AI tool should read before touching this code. */
export function renderLlms(manifest: Manifest, data: Data): string {
  const tokenLines = listTokens(data).tokens.map(renderTokenLine);

  const lines = [
    '# Lause design system',
    '',
    'Lause is the design system behind an Estonian-citizenship exam trainer: tokens, components, and the usage ' +
      'rules an AI tool needs before touching this code. This file and components.manifest.json are generated by ' +
      '`npm run build:manifest`. Read them before the source.',
    '',
    ...INSTALL_SECTION,
    '',
    '## Tokens',
    '',
    'Each line is `token: light · dark | Tailwind utility · CSS custom property | what it is for`. The theme is ' +
      'closed: these utilities exist, anything else (`bg-red-500`, `p-11`) does not.',
    '',
    ...tokenLines,
    '',
    '## Components',
    '',
    'A prop line is `name: ` then the type in backticks, with `= default` inside them when the prop has ' +
      'one, then ` | ` and the doc text, or nothing more when there is none. Read the type as the text ' +
      "between the first backtick and the next: a union's own `|` sits inside those backticks, so it is " +
      'never mistaken for the separator before the doc text.',
    '',
    manifest.components.map(renderComponent).join('\n\n'),
    '',
    '## Rules',
    '',
    ...manifest.rules.map((rule) => `- ${rule}`),
  ];
  return lines.join('\n') + '\n';
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const root = findRoot();
  const manifest = generateManifest(root);
  const manifestPath = join(root, 'components.manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const llmsPath = join(root, 'llms.txt');
  writeFileSync(llmsPath, renderLlms(manifest, loadData(root)));
  console.log(`wrote ${manifestPath}`);
  console.log(`wrote ${llmsPath}`);
}
