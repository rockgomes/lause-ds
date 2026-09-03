import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { flatten, resolve, isAlias, type Group } from '../src/dtcg.js';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { buildColors, type Anchors } from '../src/ramps.js';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../../tokens/${p}`, import.meta.url), 'utf8'));
const colors = buildColors(read('src/anchors.json') as Anchors);
const prim: Group = { ...buildScales(read('src/scales.json') as ScaleRules, colors), ...colors };
const light: Group = read('semantic.light.tokens.json');
const dark: Group = read('semantic.dark.tokens.json');

describe('semantic tokens', () => {
  it('light and dark have the same keys', () => {
    expect([...flatten(light).keys()]).toEqual([...flatten(dark).keys()]);
  });
  it('every simple value is an alias that resolves', () => {
    for (const mode of [light, dark]) for (const [path, t] of flatten(mode)) {
      if (t.$type === 'typography') continue;
      expect(isAlias(t.$value), path).toBe(true);
      expect(() => resolve(path, mode, prim)).not.toThrow();
    }
  });
  it('typography fields resolve', () => {
    for (const mode of [light, dark]) for (const [path, t] of flatten(mode)) {
      if (t.$type !== 'typography') continue;
      const v = t.$value as Record<string, unknown>;
      for (const key of ['fontFamily', 'fontSize', 'lineHeight']) {
        expect(isAlias(v[key]), `${path}.${key}`).toBe(true);
        expect(() => resolve((v[key] as string).slice(1, -1), mode, prim)).not.toThrow();
      }
      expect(typeof v.fontWeight).toBe('number');
    }
  });
  it('every alias points straight at a primitive (no semantic stacking)', () => {
    const primPaths = flatten(prim);
    for (const mode of [light, dark]) for (const [path, t] of flatten(mode)) {
      const targets = t.$type === 'typography'
        ? Object.values(t.$value as Record<string, unknown>).filter(isAlias)
        : [t.$value];
      for (const a of targets) {
        expect(isAlias(a), path).toBe(true);
        expect(primPaths.has((a as string).slice(1, -1)), `${path} -> ${a}`).toBe(true);
      }
    }
  });
});
