import primitives from '../../../../tokens/primitives.tokens.json';
import light from '../../../../tokens/semantic.light.tokens.json';
import dark from '../../../../tokens/semantic.dark.tokens.json';

/**
 * A minimal read of the DTCG shape: leaves carry `$value` (and, on the
 * semantic files, `$description`); groups nest further groups. This mirrors
 * `packages/mcp/src/data.ts`'s `Token`/`Group` but is not imported from
 * there, the site must not depend on the server package.
 */
type Token = { $value: unknown; $description?: string };
type Group = { [key: string]: Token | Group };
type Dimension = { value: number; unit: string };

export type ColourPair = { name: string; description: string; light: string; dark: string };
export type TypeRole = { role: string; family: 'content' | 'chrome'; size: number; lineHeight: number; weight: number };
export type Radius = { name: string; px: number };

const primitivesGroup = primitives as Group;
const lightGroup = light as Group;
const darkGroup = dark as Group;

function isToken(value: unknown): value is Token {
  return typeof value === 'object' && value !== null && '$value' in value;
}

function getAtPath(group: Group, path: string): Token | undefined {
  let node: Group | Token = group;
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = (node as Group)[part];
  }
  return isToken(node) ? node : undefined;
}

function isAlias(value: unknown): value is string {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

/** Resolves a `{primitive.path}` alias to its primitive `$value`. Primitive values are leaves, no further aliasing. */
function resolveAlias(alias: string): unknown {
  const path = alias.slice(1, -1);
  const token = getAtPath(primitivesGroup, path);
  if (!token) throw new Error(`unresolved alias {${path}}`);
  return token.$value;
}

/** Resolves a semantic value (alias or literal) all the way to a value of the primitive's own shape. */
function resolve(value: unknown): unknown {
  return isAlias(value) ? resolveAlias(value) : value;
}

function isDimension(value: unknown): value is Dimension {
  return !!value && typeof value === 'object' && typeof (value as Dimension).value === 'number' && typeof (value as Dimension).unit === 'string';
}

function toPx(value: unknown): number {
  const resolved = resolve(value);
  if (isDimension(resolved)) return resolved.value;
  if (typeof resolved === 'number') return resolved;
  throw new Error(`expected a dimension, got ${JSON.stringify(resolved)}`);
}

function toNumber(value: unknown): number {
  const resolved = resolve(value);
  if (typeof resolved !== 'number') throw new Error(`expected a number, got ${JSON.stringify(resolved)}`);
  return resolved;
}

function toHex(value: unknown): string {
  const resolved = resolve(value);
  if (typeof resolved !== 'string') throw new Error(`expected a colour string, got ${JSON.stringify(resolved)}`);
  return resolved.toLowerCase();
}

function toFamily(value: unknown): string[] {
  const resolved = resolve(value);
  if (!Array.isArray(resolved)) throw new Error(`expected a font family list, got ${JSON.stringify(resolved)}`);
  return resolved as string[];
}

/** Every semantic `color.*` leaf, resolved to a hex string in both modes. */
export function colourPairs(): ColourPair[] {
  const lightColors = (lightGroup.color as Group) ?? {};
  const darkColors = (darkGroup.color as Group) ?? {};
  return Object.keys(lightColors).map((key) => {
    const lightToken = lightColors[key] as Token;
    const darkToken = darkColors[key] as Token;
    return {
      name: `color.${key}`,
      description: lightToken.$description ?? '',
      light: toHex(lightToken.$value),
      dark: toHex(darkToken.$value),
    };
  });
}

// The order the site presents type roles in, not the object-key order in the
// token file, which groups the two narrow-viewport roles next to the role
// they substitute for rather than at the end of the ramp.
const TYPE_ROLE_ORDER = ['label', 'body', 'title', 'reading', 'headline', 'display', 'reading-narrow', 'headline-narrow'] as const;

/** Every `type.<role>` composite: family (content/chrome), size and lineHeight in px, and weight. */
export function typeRoles(): TypeRole[] {
  const serifFamily = toFamily('{font.family.serif}')[0];
  const typeGroup = lightGroup.type as Group;
  return TYPE_ROLE_ORDER.map((role) => {
    const token = typeGroup[role] as Token;
    const composite = token.$value as { fontFamily: unknown; fontSize: unknown; lineHeight: unknown; fontWeight: number };
    const family = toFamily(composite.fontFamily)[0];
    const size = toPx(composite.fontSize);
    const ratio = toNumber(composite.lineHeight);
    return {
      role,
      family: family === serifFamily ? 'content' : 'chrome',
      size,
      lineHeight: Math.round(size * ratio),
      weight: composite.fontWeight,
    };
  });
}

/** Every `radius.*` leaf, resolved to px. */
export function radii(): Radius[] {
  const radiusGroup = lightGroup.radius as Group;
  return Object.keys(radiusGroup).map((key) => ({ name: `radius.${key}`, px: toPx((radiusGroup[key] as Token).$value) }));
}

function formatDimension(value: unknown): string {
  const resolved = resolve(value);
  if (isDimension(resolved)) return `${resolved.value}${resolved.unit}`;
  throw new Error(`expected a dimension, got ${JSON.stringify(resolved)}`);
}

/** The `shadow.tile` composite as a CSS shorthand, e.g. `0px 6px 18px 0px rgba(15, 34, 56, 0.10)`. */
export function shadow(): string {
  const token = (lightGroup.shadow as Group).tile as Token;
  const composite = resolve(token.$value) as { offsetX: unknown; offsetY: unknown; blur: unknown; spread: unknown; color: string };
  return `${formatDimension(composite.offsetX)} ${formatDimension(composite.offsetY)} ${formatDimension(composite.blur)} ${formatDimension(composite.spread)} ${composite.color}`;
}
