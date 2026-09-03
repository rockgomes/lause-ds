import { flatten, resolve, type Group, type Token } from './dtcg.js';
import { shadowCss } from './emit-css.js';

export type FigmaVariable = { name: string; type: 'COLOR' | 'FLOAT' | 'STRING'; values: Record<string, string | number> };
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

export function emitFigmaVariables(prim: Group, light: Group, dark: Group): FigmaFile {
  const primitives: FigmaVariable[] = [];
  for (const [path, t] of flatten(prim)) {
    const fv = figmaValue(t);
    if (fv) primitives.push({ name: figmaName(path), type: fv.type, values: { Value: fv.value } });
  }
  const semantic: FigmaVariable[] = [];
  const darkMap = flatten(dark);
  for (const [path, t] of flatten(light)) {
    if (t.$type === 'typography') {
      const lv = t.$value as Record<string, string | number>;
      const dv = darkMap.get(path)!.$value as Record<string, string | number>;
      const part = (mode: Group, v: Record<string, string | number>, key: string) =>
        figmaValue(resolve(String(v[key]).slice(1, -1), mode, prim))!;
      for (const key of ['fontFamily', 'fontSize', 'lineHeight']) {
        const l = part(light, lv, key), d = part(dark, dv, key);
        semantic.push({ name: `${figmaName(path)}/${key}`, type: l.type, values: { Light: l.value, Dark: d.value } });
      }
      semantic.push({ name: `${figmaName(path)}/fontWeight`, type: 'FLOAT', values: { Light: lv.fontWeight, Dark: dv.fontWeight } });
      continue;
    }
    const l = figmaValue(resolve(path, light, prim))!;
    const d = figmaValue(resolve(path, dark, prim))!;
    semantic.push({ name: figmaName(path), type: l.type, values: { Light: l.value, Dark: d.value } });
  }
  return {
    collections: [
      { name: 'Primitives', modes: ['Value'], variables: primitives },
      { name: 'Semantic', modes: ['Light', 'Dark'], variables: semantic },
    ],
  };
}
