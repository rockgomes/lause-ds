import { flatten, isAlias, resolve, type Group, type Token } from './dtcg.js';
import { shadowCss } from './emit-css.js';

export type FigmaValue = string | number | { alias: string };
export type FigmaVariable = { name: string; type: 'COLOR' | 'FLOAT' | 'STRING'; values: Record<string, FigmaValue> };
export type FigmaCollection = { name: string; modes: string[]; variables: FigmaVariable[] };
export type FigmaFile = { collections: FigmaCollection[] };

function figmaValue(t: Token): { type: FigmaVariable['type']; value: string | number } | null {
  const v = t.$value as any;
  switch (t.$type) {
    case 'color': return { type: 'COLOR', value: v };
    case 'dimension': return { type: 'FLOAT', value: v.value };
    case 'number': return { type: 'FLOAT', value: v };
    case 'fontFamily': return { type: 'STRING', value: v[0] };
    case 'shadow': return { type: 'STRING', value: shadowCss(v) };
    default: return null;
  }
}

const figmaName = (path: string) => path.replace(/\./g, '/');

function aliasValue(rawValue: unknown, path: string): { alias: string } {
  if (!isAlias(rawValue)) throw new Error(`expected an alias at ${path}, got ${JSON.stringify(rawValue)}`);
  return { alias: figmaName(rawValue.slice(1, -1)) };
}

// A role's line height binds in Figma as pixels, not the unitless ratio stored in type.leading.*.
function lineHeightPx(mode: Group, prim: Group, v: Record<string, unknown>): number {
  const fontSizeTok = resolve(String(v.fontSize).slice(1, -1), mode, prim);
  const leadingTok = resolve(String(v.lineHeight).slice(1, -1), mode, prim);
  const fontSizePx = figmaValue(fontSizeTok)!.value as number;
  const leadingRatio = figmaValue(leadingTok)!.value as number;
  return Math.round(fontSizePx * leadingRatio);
}

export function emitFigmaVariables(prim: Group, light: Group, dark: Group): FigmaFile {
  const primitives: FigmaVariable[] = [];
  for (const [path, t] of flatten(prim)) {
    const fv = figmaValue(t);
    if (fv) primitives.push({ name: figmaName(path), type: fv.type, values: { Value: fv.value } });
  }
  const semantic: FigmaVariable[] = [];
  const darkMap = flatten(dark);
  for (const [path, t] of flatten(light)) {
    const dt = darkMap.get(path)!;
    if (t.$type === 'typography') {
      const lv = t.$value as Record<string, unknown>;
      const dv = dt.$value as Record<string, unknown>;
      for (const key of ['fontFamily', 'fontSize'] as const) {
        const type = figmaValue(resolve(String(lv[key]).slice(1, -1), light, prim))!.type;
        semantic.push({
          name: `${figmaName(path)}/${key}`,
          type,
          values: { Light: aliasValue(lv[key], `${path}.${key}`), Dark: aliasValue(dv[key], `${path}.${key}`) },
        });
      }
      semantic.push({
        name: `${figmaName(path)}/lineHeight`,
        type: 'FLOAT',
        values: { Light: lineHeightPx(light, prim, lv), Dark: lineHeightPx(dark, prim, dv) },
      });
      semantic.push({ name: `${figmaName(path)}/fontWeight`, type: 'FLOAT', values: { Light: lv.fontWeight as number, Dark: dv.fontWeight as number } });
      continue;
    }
    const type = figmaValue(resolve(path, light, prim))!.type;
    semantic.push({
      name: figmaName(path),
      type,
      values: { Light: aliasValue(t.$value, path), Dark: aliasValue(dt.$value, path) },
    });
  }
  return {
    collections: [
      { name: 'Primitives', modes: ['Value'], variables: primitives },
      { name: 'Semantic', modes: ['Light', 'Dark'], variables: semantic },
    ],
  };
}
