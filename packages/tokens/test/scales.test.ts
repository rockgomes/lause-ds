import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { buildColors, type Anchors } from '../src/ramps.js';
import { flatten } from '../src/dtcg.js';

const rules = JSON.parse(readFileSync(new URL('../../../tokens/src/scales.json', import.meta.url), 'utf8')) as ScaleRules;
const anchors = JSON.parse(readFileSync(new URL('../../../tokens/src/anchors.json', import.meta.url), 'utf8')) as Anchors;
const colors = buildColors(anchors);

describe('scales', () => {
  it('builds the 16 × 1.2 type ramp, rounded', () => {
    const g = buildScales(rules, colors);
    const sizes = Object.keys((g.type as any).size).map(Number);
    expect(sizes).toEqual([11, 13, 16, 19, 23, 28, 33, 40, 48, 57, 69, 83, 99, 119, 143]);
  });
  it('applies a tuning with its note', () => {
    const g = buildScales({ ...rules, type: { ...rules.type, tuned: { '57': { value: 56, note: 'reads heavy' } } } }, colors);
    const t = flatten(g).get('type.size.57')!;
    expect(t.$value).toEqual({ value: 56, unit: 'px' });
    expect(t.$description).toBe('reads heavy');
  });
  it('emits the other groups with DTCG types', () => {
    const f = flatten(buildScales(rules, colors));
    expect(f.get('space.8')?.$value).toEqual({ value: 8, unit: 'px' });
    expect(f.get('radius.pill')?.$value).toEqual({ value: 999, unit: 'px' });
    expect(f.get('stroke.thin')?.$value).toEqual({ value: 1.5, unit: 'px' });
    expect(f.get('stroke.focus')?.$value).toEqual({ value: 2, unit: 'px' });
    expect(f.get('type.leading.open')?.$value).toBe(1.85);
    expect(f.get('font.family.serif')?.$value).toEqual(['Source Serif 4', 'Georgia', 'serif']);
    expect(f.get('opacity.dim')?.$value).toBe(0.38);
    expect(f.get('shadow.mid')?.$type).toBe('shadow');
    expect((f.get('shadow.mid')?.$value as any).offsetY).toEqual({ value: 6, unit: 'px' });
    expect((f.get('shadow.mid')?.$value as any).color).toBe('rgba(15, 34, 56, 0.10)');
  });
  it('derives the shadow tint from the navy anchor', () => {
    const f = flatten(buildScales(rules, colors));
    expect((f.get('shadow.mid')?.$value as any).color).toBe('rgba(15, 34, 56, 0.10)');
  });
  it('throws a named error when the shadow hue/step does not exist', () => {
    const badRules: ScaleRules = { ...rules, shadow: { mid: { ...rules.shadow.mid, color: { hue: 'nope', step: '900', alpha: 0.1 } } } };
    expect(() => buildScales(badRules, colors)).toThrow(/unknown color step/);
  });
  it('emits the mark and pin strokes and the caps tracking', () => {
    const f = flatten(buildScales(rules, colors));
    expect(f.get('stroke.mark')?.$value).toEqual({ value: 3, unit: 'px' });
    expect(f.get('stroke.pin')?.$value).toEqual({ value: 4, unit: 'px' });
    expect(f.get('type.tracking.caps')?.$value).toEqual({ value: 0.1, unit: 'em' });
  });
});
