import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Copied from packages/tokens/src/dtcg.ts — the two packages stay independent,
// so this is a deliberate duplication rather than a shared dependency.
export type Token = { $type: string; $value: unknown; $description?: string };
export type Group = { [key: string]: Token | Group };

export type ManifestProp = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  doc: string;
};

export type ManifestComponent = {
  name: string;
  kind: 'component' | 'hook';
  source: string;
  summary: string;
  props: ManifestProp[];
  states: string[];
  proofScreen: string;
  figma?: { setId?: string; componentId?: string; file: string };
  rules: string[];
};

export type Manifest = {
  generatedFrom?: { inputs: string[] };
  components: ManifestComponent[];
  rules: string[];
};

export type Ledger = Record<string, unknown>;

export type Data = {
  primitives: Group;
  light: Group;
  dark: Group;
  manifest: Manifest;
  llms: string;
  figma: Ledger;
  /** The bundled theme.css text, when loaded via `dataFromBundle`. */
  themeCss?: string;
  /** Bundled component source/story text, keyed by directory name, when loaded via `dataFromBundle`. */
  sources?: Record<string, { source: string | null; stories: string | null }>;
};

/**
 * The exact shape `copy-data.mjs` writes to `dist/data/bundle.json`: every
 * file `loadData`/`getComponent`/`checkUsage` would otherwise read off disk,
 * inlined as parsed JSON or raw text so esbuild can bundle it into the
 * hosted Netlify function, which has neither a monorepo root nor these files
 * on disk at runtime. A field is `null` when its source file was missing at
 * build time — the same case `copy-data.mjs` already warns about.
 */
export type Bundle = {
  primitives: Group | null;
  light: Group | null;
  dark: Group | null;
  manifest: Manifest | null;
  llms: string | null;
  figma: Ledger | null;
  themeCss: string | null;
  sources: Record<string, { source: string | null; stories: string | null }>;
};

/**
 * Finds the monorepo root by walking up from this module's location until a
 * directory holding a `package.json` with a `"workspaces"` key is found.
 * Falls back to `<dir of this file>/data` — the layout `copy-data.mjs`
 * produces for the published package, where there is no workspace root to
 * find.
 */
export function findRoot(): string {
  const startDir = dirname(fileURLToPath(import.meta.url));
  let dir = startDir;
  for (;;) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
        if (pkg && typeof pkg === 'object' && 'workspaces' in pkg) return dir;
      } catch {
        // Not valid JSON — keep walking up.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break; // reached the filesystem root without a match
    dir = parent;
  }
  return join(startDir, 'data');
}

function readJSON(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readJSONOr<T>(path: string, fallback: T): T {
  if (!existsSync(path)) {
    console.warn(`lause-ds-mcp: ${path} not found, using fallback`);
    return fallback;
  }
  return readJSON(path) as T;
}

export function loadData(root: string = findRoot()): Data {
  const primitives = readJSON(join(root, 'tokens/primitives.tokens.json')) as Group;
  const light = readJSON(join(root, 'tokens/semantic.light.tokens.json')) as Group;
  const dark = readJSON(join(root, 'tokens/semantic.dark.tokens.json')) as Group;
  const manifest = readJSONOr<Manifest>(join(root, 'components.manifest.json'), {
    components: [],
    rules: [],
  });
  const llmsPath = join(root, 'llms.txt');
  const llms = existsSync(llmsPath) ? readFileSync(llmsPath, 'utf8') : '';
  const figma = readJSON(join(root, 'figma/library.json')) as Ledger;
  return { primitives, light, dark, manifest, llms, figma };
}

/**
 * Builds the same `Data` shape `loadData` returns, but from an in-memory
 * `Bundle` instead of the filesystem — this is what the hosted Netlify
 * function uses, since its esbuild bundle has no monorepo root to call
 * `loadData(findRoot())` against. `themeCss` and `sources` ride along as the
 * two bundle-only fields `getComponent` and `checkUsage` prefer when present.
 */
export function dataFromBundle(bundle: Bundle): Data {
  if (!bundle.primitives) throw new Error('bundle missing primitives tokens');
  if (!bundle.light) throw new Error('bundle missing light semantic tokens');
  if (!bundle.dark) throw new Error('bundle missing dark semantic tokens');
  if (!bundle.figma) throw new Error('bundle missing figma ledger');
  return {
    primitives: bundle.primitives,
    light: bundle.light,
    dark: bundle.dark,
    manifest: bundle.manifest ?? { components: [], rules: [] },
    llms: bundle.llms ?? '',
    figma: bundle.figma,
    themeCss: bundle.themeCss ?? undefined,
    sources: bundle.sources,
  };
}

function isToken(v: unknown): v is Token {
  return typeof v === 'object' && v !== null && '$value' in v;
}

function getAtPath(group: Group, path: string): Token | undefined {
  const parts = path.split('.');
  let node: Group | Token = group;
  for (const part of parts) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = (node as Group)[part];
  }
  return isToken(node) ? node : undefined;
}

function isAlias(value: unknown): value is string {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

function isDimension(value: unknown): value is { value: number; unit: string } {
  return (
    !!value &&
    typeof value === 'object' &&
    'value' in value &&
    'unit' in value &&
    typeof (value as { value: unknown }).value === 'number' &&
    typeof (value as { unit: unknown }).unit === 'string'
  );
}

function isShadowComposite(
  value: unknown,
): value is { color: string; offsetX: unknown; offsetY: unknown; blur: unknown; spread: unknown } {
  return (
    !!value &&
    typeof value === 'object' &&
    'color' in value &&
    'offsetX' in value &&
    'offsetY' in value &&
    'blur' in value &&
    'spread' in value
  );
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (isShadowComposite(value)) {
    return `${formatValue(value.offsetX)} ${formatValue(value.offsetY)} ${formatValue(value.blur)} ${formatValue(value.spread)} ${value.color}`;
  }
  if (isDimension(value)) return `${value.value}${value.unit}`;
  return String(value);
}

/**
 * Resolves a semantic token to its primitive value. Semantic token values are
 * always a single `{alias}` hop into the primitive group — this is that
 * one-hop rule, not the general alias-chasing `resolve` in
 * packages/tokens/src/dtcg.ts.
 */
export function resolveToken(data: Data, path: string, mode: 'light' | 'dark'): string {
  const group = mode === 'light' ? data.light : data.dark;
  const semanticToken = getAtPath(group, path);
  if (!semanticToken) throw new Error(`no such semantic token: ${path}`);
  if (!isAlias(semanticToken.$value)) return formatValue(semanticToken.$value);
  const aliasPath = semanticToken.$value.slice(1, -1);
  const primitiveToken = getAtPath(data.primitives, aliasPath);
  if (!primitiveToken) throw new Error(`unresolved alias {${aliasPath}}`);
  return formatValue(primitiveToken.$value);
}
