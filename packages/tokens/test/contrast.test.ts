import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { checkPairs, type Pair } from '../src/contrast.js';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { buildColors, type Anchors } from '../src/ramps.js';
import type { Group } from '../src/dtcg.js';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../../tokens/${p}`, import.meta.url), 'utf8'));
const colors = buildColors(read('src/anchors.json') as Anchors);
const prim: Group = { ...buildScales(read('src/scales.json') as ScaleRules, colors), ...colors };
const pairs = read('src/contrast-pairs.json') as Pair[];

describe('contrast', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`${mode}: every pair meets its minimum`, () => {
      const results = checkPairs(pairs, read(`semantic.${mode}.tokens.json`), prim);
      const failing = results.filter((r) => !r.ok).map((r) => `${r.fg} on ${r.bg} = ${r.ratio.toFixed(2)} < ${r.min} (${r.use})`);
      expect(failing).toEqual([]);
    });
  }
  it('reports a ratio for a known pair', () => {
    const [r] = checkPairs([{ fg: 'color.ink', bg: 'color.ground', min: 4.5, use: 't' }], read('semantic.light.tokens.json'), prim);
    expect(r.ratio).toBeGreaterThan(10);
  });
});
