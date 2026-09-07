import { describe, expect, it } from 'vitest';
import { colourPairs, typeRoles } from '../src/data/tokens.js';

describe('tokens data', () => {
  it('resolves every semantic colour to a hex in both modes', () => {
    const pairs = colourPairs();
    expect(pairs.map((p) => p.name)).toContain('color.ink');
    for (const p of pairs) {
      expect(p.light).toMatch(/^#[0-9a-f]{6}$/);
      expect(p.dark).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(pairs.find((p) => p.name === 'color.ink')?.light).toBe('#0f2238');
  });

  it('lists the eight type roles with numeric sizes', () => {
    // Eight roles: the original six plus reading-narrow and headline-narrow (below-640px sizes).
    expect(typeRoles().map((r) => r.role)).toEqual([
      'label',
      'body',
      'title',
      'reading',
      'headline',
      'display',
      'reading-narrow',
      'headline-narrow',
    ]);
    for (const r of typeRoles()) expect(r.size).toBeGreaterThan(0);
  });
});
