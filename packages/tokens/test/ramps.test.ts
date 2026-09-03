import { describe, it, expect } from 'vitest';
import { oklch, parse } from 'culori';
import { buildRamp, nearestStep, buildColors, STEPS } from '../src/ramps.js';
import { flatten } from '../src/dtcg.js';

const L = (hex: string) => oklch(parse(hex)!)!.l;

describe('ramps', () => {
  it('has 11 steps in order', () => {
    expect(Object.keys(buildRamp('#0f2238'))).toEqual(STEPS);
  });
  it('keeps the anchor exact at its nearest step', () => {
    expect(nearestStep('#0f2238')).toBe('900');
    expect(buildRamp('#0f2238')['900']).toBe('#0f2238');
    expect(nearestStep('#e4edf3')).toBe('100');
    expect(buildRamp('#e4edf3')['100']).toBe('#e4edf3');
    expect(nearestStep('#ff5a36')).toBe('500');
    expect(buildRamp('#ff5a36')['500']).toBe('#ff5a36');
  });
  it('gets darker as the step number grows', () => {
    const r = buildRamp('#ff5a36');
    for (let i = 1; i < STEPS.length; i++) expect(L(r[STEPS[i]])).toBeLessThan(L(r[STEPS[i - 1]]));
  });
  it('emits every step as a hex string', () => {
    for (const hex of Object.values(buildRamp('#e4edf3'))) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('builds the colour group', () => {
    const f = flatten(buildColors({ hues: { navy: '#0f2238' }, white: '#ffffff', black: '#000000' }));
    expect(f.get('color.navy.900')?.$value).toBe('#0f2238');
    expect(f.get('color.white')?.$value).toBe('#ffffff');
    expect(f.size).toBe(13);
  });
  it('throws a named error on an invalid anchor colour', () => {
    expect(() => buildRamp('#0f223')).toThrow(/invalid anchor colour/);
  });
});
