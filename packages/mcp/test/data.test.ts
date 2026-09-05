import { describe, it, expect } from 'vitest';
import { loadData, resolveToken } from '../src/data.js';

describe('data', () => {
  const data = loadData();
  it('loads the three token files', () => {
    expect(data.primitives.color).toBeDefined();
    expect(Object.keys(data.light.color)).toContain('ink');
  });
  it('resolves a semantic token in both modes', () => {
    expect(resolveToken(data, 'color.ink', 'light')).toBe('#0f2238');
    expect(resolveToken(data, 'color.ink', 'dark')).toBe('#e3ecf7');
  });
  it('loads the figma ledger', () => {
    expect(data.figma.fileKey).toBe('Fi9CrQ0KzJdpCuwNcWbZKF');
  });
  it('resolves a shadow composite to the CSS shorthand', () => {
    expect(resolveToken(data, 'shadow.tile', 'light')).toBe('0px 6px 18px 0px rgba(15, 34, 56, 0.10)');
  });
  it('resolves a font stack to a comma-joined family list', () => {
    expect(resolveToken(data, 'font.content', 'light')).toBe('Young Serif, Georgia, serif');
  });
});
