import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
// typescript 7 (tsgo) exposes the compiler API only under unstable/; pinned exactly in the root package.json — revisit on any TypeScript bump.
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
import { findRoot, loadData, type Data, type Group, type Manifest, type ManifestComponent, type ManifestProp, type Token } from './data.js';

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
};

// Per-component usage rules, English. Components not listed here have no rules of their own.
const RULES_BY_COMPONENT: Record<string, string[]> = {
  Button: [
    'Every control shows its key: pass keycap whenever there is one.',
    'filled is the one primary action on a screen.',
    'Disabled controls never hover.',
  ],
  Tile: [
    'Options stack vertically in a TileStack, never in a row, except the two of a true/false item.',
    'Options run to 40 characters.',
  ],
  Sentence: [
    'The English pair (text + note) is required together: the note says the translation is unofficial.',
    'Term ids that repeat pin together.',
  ],
  Nav: ['Chrome stays Estonian; while peeking it swaps to English and never gains a subtitle.'],
  Cell: ['Rows Igaüks / Eesti kodanik, columns Tohib piirata / Ei tohi piirata; keys 1–4.'],
  Bubble: ['Sits above its word; the count is decorative to assistive technology.'],
  Dial: ['The exam disables it as one control.'],
  Progress: ['One segment per unit; the counts are given in words.'],
  Bar: ['One segment per unit; the counts are given in words.'],
};

// The system-wide rules every component obeys, regardless of what it is.
const SYSTEM_RULES: string[] = [
  'Use only token utilities: the Tailwind theme is closed, so bg-red-500 or p-11 do not exist.',
  'Two fonts only: font-content (Young Serif) for what is being learned, font-chrome (Instrument Sans) for the app.',
  'Type is used through the six roles (label, body, title, reading, headline, display), never a size number.',
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
 * simple (non-generic) type-alias references up to a few hops — e.g.
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
 * in the property's own annotation, e.g. `ReactNode` rather than `ReactNode`'s expansion — which
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

function isTokenNode(value: unknown): value is Token {
  return typeof value === 'object' && value !== null && '$value' in value;
}

/** Every leaf token path in a group, dot-joined, in file order. */
function collectTokenPaths(group: Group, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(group)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isTokenNode(value)) paths.push(path);
    else paths.push(...collectTokenPaths(value as Group, path));
  }
  return paths;
}

function getTokenNode(group: Group, path: string): Token | undefined {
  const parts = path.split('.');
  let node: Group | Token = group;
  for (const part of parts) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = (node as Group)[part];
  }
  return isTokenNode(node) ? node : undefined;
}

function getDescription(group: Group, path: string): string | undefined {
  return getTokenNode(group, path)?.$description;
}

function isAlias(value: unknown): value is string {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

/**
 * A richer sibling of `resolveToken` in data.ts: that one intentionally stops at the first
 * primitive `$value`, which is enough for a plain color or dimension but prints `[object Object]`
 * for the composite tokens (typography, shadow) — those need one more hop into their own fields,
 * each of which is itself a `{...}` alias into the primitives. Independent on purpose, same as the
 * duplication data.ts already carries from packages/tokens/src/dtcg.ts.
 */
function formatTokenValue(primitives: Group, value: unknown): string {
  if (isAlias(value)) {
    const primitive = getTokenNode(primitives, value.slice(1, -1));
    return primitive ? formatTokenValue(primitives, primitive.$value) : value;
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    if ('value' in value && 'unit' in value) {
      const dimension = value as { value: number; unit: string };
      return `${dimension.value}${dimension.unit}`;
    }
    return Object.entries(value as Record<string, unknown>)
      .map(([field, fieldValue]) => `${field} ${formatTokenValue(primitives, fieldValue)}`)
      .join(', ');
  }
  return String(value);
}

function formatSemanticToken(data: Data, path: string, mode: 'light' | 'dark'): string {
  const token = getTokenNode(mode === 'light' ? data.light : data.dark, path);
  return token ? formatTokenValue(data.primitives, token.$value) : '';
}

function renderProp(prop: ManifestProp): string {
  const optional = prop.required ? '' : '?';
  const withDefault = prop.default !== undefined ? ` = ${prop.default}` : '';
  const withDoc = prop.doc ? ` — ${prop.doc}` : '';
  return `- ${prop.name}${optional}: ${prop.type}${withDefault}${withDoc}`;
}

function renderComponent(component: ManifestComponent): string {
  const lines = [`## ${component.name}`, '', component.summary];
  if (component.props.length > 0) {
    lines.push('', '### Props', ...component.props.map(renderProp));
  }
  if (component.states.length > 0) {
    lines.push('', `States: ${component.states.join(', ')}`);
  }
  if (component.rules.length > 0) {
    lines.push('', '### Rules', ...component.rules.map((rule) => `- ${rule}`));
  }
  lines.push('', `Source: ${component.source}`);
  if (component.figma) {
    const ref = component.figma.setId ? `set ${component.figma.setId}` : `component ${component.figma.componentId}`;
    lines.push(`Figma: ${component.figma.file} (${ref})`);
  }
  return lines.join('\n');
}

/** Renders `llms.txt`: the tokens and components an AI tool should read before touching this code. */
export function renderLlms(manifest: Manifest, data: Data): string {
  const tokenLines = collectTokenPaths(data.light).map((path) => {
    const light = formatSemanticToken(data, path, 'light');
    const dark = formatSemanticToken(data, path, 'dark');
    const description = getDescription(data.light, path);
    return `${path}: ${light} (light) · ${dark} (dark)${description ? ` — ${description}` : ''}`;
  });

  const lines = [
    '# Lause design system',
    '',
    'Lause is the design system behind an Estonian-citizenship exam trainer: tokens, components, and the usage ' +
      'rules an AI tool needs before touching this code. This file and components.manifest.json are generated by ' +
      '`npm run build:manifest` — read them before the source.',
    '',
    '## Tokens',
    '',
    ...tokenLines,
    '',
    '## Components',
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
