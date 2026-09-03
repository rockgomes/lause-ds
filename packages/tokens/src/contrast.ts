import { wcagContrast } from 'culori';
import { resolve, type Group } from './dtcg.js';

export type Pair = { fg: string; bg: string; min: number; use: string };
export type Result = Pair & { ratio: number; ok: boolean };

export function checkPairs(pairs: Pair[], semantic: Group, prim: Group): Result[] {
  return pairs.map((p) => {
    const fg = resolve(p.fg, semantic, prim).$value as string;
    const bg = resolve(p.bg, semantic, prim).$value as string;
    const ratio = wcagContrast(fg, bg);
    return { ...p, ratio, ok: ratio >= p.min };
  });
}
