import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { findRoot, resolveToken, type Data, type Group, type ManifestComponent, type Token } from './data.js';

function isToken(v: unknown): v is Token {
  return typeof v === 'object' && v !== null && '$value' in v;
}

/** Every leaf token path in a group, dot-joined, in file order. */
function flatten(group: Group, prefix = ''): [string, Token][] {
  const entries: [string, Token][] = [];
  for (const [key, value] of Object.entries(group)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isToken(value)) entries.push([path, value]);
    else entries.push(...flatten(value as Group, path));
  }
  return entries;
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

/** Resolves a `{...}` alias one hop into the primitive group; returns non-alias values unchanged. */
function resolvePrimitiveValue(data: Data, value: unknown): unknown {
  if (!isAlias(value)) return value;
  const primitive = getAtPath(data.primitives, value.slice(1, -1));
  return primitive ? primitive.$value : value;
}

function formatFontFamily(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function formatDimension(value: unknown): string {
  if (value && typeof value === 'object' && 'value' in value && 'unit' in value) {
    const dimension = value as { value: number; unit: string };
    return `${dimension.value}${dimension.unit}`;
  }
  return String(value);
}

export type TypographyValue = {
  fontFamily: string;
  fontSize: string;
  lineHeight: number;
  fontWeight: number;
};

function resolveTypography(data: Data, value: Record<string, unknown>): TypographyValue {
  return {
    fontFamily: formatFontFamily(resolvePrimitiveValue(data, value.fontFamily)),
    fontSize: formatDimension(resolvePrimitiveValue(data, value.fontSize)),
    lineHeight: resolvePrimitiveValue(data, value.lineHeight) as number,
    fontWeight: resolvePrimitiveValue(data, value.fontWeight) as number,
  };
}

/**
 * The Tailwind theme key for a semantic token path: `color.x` -> `x` (bg-x/text-x),
 * `font.content` -> `font-content`, `radius.x` -> `rounded-x`, `shadow.x` -> `shadow-x`.
 * `type.<role>` typography roles are handled separately, as `text-<role>`.
 */
function tailwindKey(path: string): string {
  const dot = path.indexOf('.');
  const group = path.slice(0, dot);
  const name = path.slice(dot + 1);
  switch (group) {
    case 'color':
      return name;
    case 'font':
      return `font-${name}`;
    case 'radius':
      return `rounded-${name}`;
    case 'shadow':
      return `shadow-${name}`;
    default:
      return name;
  }
}

export type TokenEntry = {
  name: string;
  type: string;
  light: string | TypographyValue;
  dark: string | TypographyValue;
  css: string;
  tailwind: string;
  description: string;
};

/**
 * Every semantic token, walked from `data.light`. A typography role
 * (`type.<role>`) becomes one entry with the resolved type ramp for both
 * modes; every other leaf becomes one entry with its resolved value.
 */
export function listTokens(data: Data): { tokens: TokenEntry[] } {
  const tokens: TokenEntry[] = [];
  for (const [path, token] of flatten(data.light)) {
    if (path.startsWith('type.')) {
      const role = path.slice('type.'.length);
      const darkToken = getAtPath(data.dark, path);
      tokens.push({
        name: path,
        type: 'typography',
        light: resolveTypography(data, token.$value as Record<string, unknown>),
        dark: resolveTypography(data, (darkToken ?? token).$value as Record<string, unknown>),
        css: `--lause-type-${role}-size`,
        tailwind: `text-${role}`,
        description: token.$description ?? '',
      });
      continue;
    }
    tokens.push({
      name: path,
      type: token.$type,
      light: resolveToken(data, path, 'light'),
      dark: resolveToken(data, path, 'dark'),
      css: `--lause-${path.replace(/\./g, '-')}`,
      tailwind: tailwindKey(path),
      description: token.$description ?? '',
    });
  }
  return { tokens };
}

export type ComponentSummary = {
  name: string;
  kind: 'component' | 'hook';
  summary: string;
};

/** Every component and hook in the manifest, with its kind and one-line summary. */
export function listComponents(data: Data): { components: ComponentSummary[] } {
  return {
    components: data.manifest.components.map((c) => ({ name: c.name, kind: c.kind, summary: c.summary })),
  };
}

export type GetComponentSuccess = ManifestComponent & { sourceText: string; storiesText: string };
export type GetComponentError = { isError: true; message: string };
export type GetComponentResult = GetComponentSuccess | GetComponentError;

/** The story file next to `source`, e.g. `Tile/Tile.tsx` -> `Tile/Tile.stories.tsx`. */
function storiesPathFor(source: string): string {
  const dir = dirname(source);
  return join(dir, `${basename(dir)}.stories.tsx`);
}

const NOT_AVAILABLE = '(not available in this build)';

function readTextOrPlaceholder(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : NOT_AVAILABLE;
}

/**
 * The manifest entry for `name` plus its source and story file text. Unknown
 * names return an error listing every known component name, in manifest
 * order, rather than guessing. When `data.sources[dirName]` is present (the
 * hosted Netlify function's bundled data — see `dataFromBundle`), where `dirName`
 * is the directory name derived from `component.source`, its text is used
 * directly; otherwise the source and story files are read from `root`,
 * which is how stdio and tests still work. Either way, a missing source or
 * story file yields the placeholder string rather than throwing.
 *
 * `root` is optional and `findRoot()` is called only when the bundle misses,
 * so the hosted function — which always hits the bundle — never touches the
 * filesystem, not even to discover a root it would not read from.
 */
export function getComponent(data: Data, name: string, root?: string): GetComponentResult {
  const component = data.manifest.components.find((c) => c.name === name);
  if (!component) {
    const known = data.manifest.components.map((c) => c.name).join(', ');
    return { isError: true, message: `Unknown component "${name}". Known: ${known}` };
  }
  const dirName = basename(dirname(component.source));
  const bundled = data.sources?.[dirName];
  if (bundled) {
    return { ...component, sourceText: bundled.source ?? NOT_AVAILABLE, storiesText: bundled.stories ?? NOT_AVAILABLE };
  }
  const dir = root ?? findRoot();
  return {
    ...component,
    sourceText: readTextOrPlaceholder(join(dir, component.source)),
    storiesText: readTextOrPlaceholder(join(dir, storiesPathFor(component.source))),
  };
}
