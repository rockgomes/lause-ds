import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitTokensCss, emitThemeCss, cssName } from '../src/emit-css.js';
import { emitFigmaVariables } from '../src/emit-figma.js';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { buildColors, type Anchors } from '../src/ramps.js';
import type { Group } from '../src/dtcg.js';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../../tokens/${p}`, import.meta.url), 'utf8'));
const colors = buildColors(read('src/anchors.json') as Anchors);
const prim: Group = { ...buildScales(read('src/scales.json') as ScaleRules, colors), ...colors };
const light: Group = read('semantic.light.tokens.json');
const dark: Group = read('semantic.dark.tokens.json');

describe('emit css', () => {
  const css = emitTokensCss(prim, light, dark);
  it('names variables from paths', () => {
    expect(cssName('color.navy.500')).toBe('--lause-color-navy-500');
  });
  it('emits primitives with raw values', () => {
    expect(css).toContain('--lause-color-navy-900: #0f2238;');
    expect(css).toContain('--lause-type-size-57: 57px;');
    expect(css).toContain('--lause-font-family-serif: "Young Serif", Georgia, serif;');
  });
  it('emits semantics as var() references, light in the :root/[data-theme="light"] island and dark under data-theme', () => {
    expect(css).toMatch(/:root, \[data-theme="light"\] \{[^}]*--lause-color-ink: var\(--lause-color-navy-900\);/s);
    expect(css).toMatch(/\[data-theme="dark"\] \{[^}]*--lause-color-ink: var\(--lause-color-ice-100\);/s);
  });
  it('expands typography roles', () => {
    expect(css).toContain('--lause-type-reading-size: var(--lause-type-size-57);');
    expect(css).toContain('--lause-type-reading-weight: 400;');
  });
  it('serializes composite shadows as one CSS value', () => {
    expect(css).toContain('--lause-shadow-mid: 0px 6px 18px 0px rgba(15, 34, 56, 0.10);');
    expect(css).toContain('--lause-shadow-tile: var(--lause-shadow-mid);');
  });
});

describe('emit theme', () => {
  const theme = emitThemeCss(prim, light);
  it('leads with the dark variant tied to [data-theme], ahead of the theme block', () => {
    expect(theme.startsWith('@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));\n\n@theme inline {')).toBe(true);
  });
  it('closes the default colour scale before defining the token colours', () => {
    const closeIndex = theme.indexOf('--color-*: initial;');
    const inkIndex = theme.indexOf('--color-ink:');
    expect(closeIndex).toBeGreaterThan(-1);
    expect(inkIndex).toBeGreaterThan(closeIndex);
  });
  it('maps tokens into a Tailwind v4 theme block', () => {
    expect(theme).toContain('@theme inline {');
    expect(theme).toContain('--color-ink: var(--lause-color-ink);');
    expect(theme).toContain('--font-content: var(--lause-font-content);');
    expect(theme).toContain('--text-reading: var(--lause-type-reading-size);');
    expect(theme).toContain('--text-reading--line-height: var(--lause-type-reading-leading);');
    expect(theme).toContain('--radius-control: var(--lause-radius-control);');
  });
  it('exposes primitive spacing and leading as Tailwind theme values', () => {
    expect(theme).toContain('--spacing-16: var(--lause-space-16);');
    expect(theme).toContain('--leading-snug: var(--lause-type-leading-snug);');
  });
  it('closes the default tracking scale and exposes tracking as a Tailwind theme value', () => {
    expect(theme).toContain('--tracking-*: initial;');
    expect(theme).toContain('--tracking-caps: var(--lause-type-tracking-caps);');
  });
});

describe('emit figma', () => {
  const f = emitFigmaVariables(prim, light, dark);
  it('emits opacity as a percentage, the scale Figma binds', () => {
    const o = f.collections[0].variables.find((v) => v.name === 'opacity/faint')!;
    expect(o).toEqual({ name: 'opacity/faint', type: 'FLOAT', values: { Value: 18 } });
  });
  it('has two collections with the right modes', () => {
    expect(f.collections.map((c) => [c.name, c.modes])).toEqual([['Primitives', ['Value']], ['Semantic', ['Light', 'Dark']]]);
  });
  it('carries semantic colours as aliases to their primitive, per mode', () => {
    const ink = f.collections[1].variables.find((v) => v.name === 'color/ink')!;
    expect(ink.type).toBe('COLOR');
    expect(ink.values).toEqual({ Light: { alias: 'color/navy/900' }, Dark: { alias: 'color/ice/100' } });
  });
  it('carries primitive dimensions as literal floats', () => {
    const s = f.collections[0].variables.find((v) => v.name === 'type/size/57')!;
    expect(s).toEqual({ name: 'type/size/57', type: 'FLOAT', values: { Value: 57 } });
  });
  it('carries semantic shadows as an alias per mode', () => {
    const s = f.collections[1].variables.find((v) => v.name === 'shadow/tile')!;
    expect(s).toEqual({ name: 'shadow/tile', type: 'STRING', values: { Light: { alias: 'shadow/mid' }, Dark: { alias: 'shadow/mid' } } });
  });
  it('computes typography line height in pixels', () => {
    const s = f.collections[1].variables.find((v) => v.name === 'type/body/lineHeight')!;
    expect(s).toEqual({ name: 'type/body/lineHeight', type: 'FLOAT', values: { Light: 24, Dark: 24 } });
  });
  it('computes reading line height in pixels', () => {
    const s = f.collections[1].variables.find((v) => v.name === 'type/reading/lineHeight')!;
    expect(s).toEqual({ name: 'type/reading/lineHeight', type: 'FLOAT', values: { Light: 105, Dark: 105 } });
  });
  it('carries typography fontFamily and fontSize as aliases', () => {
    const family = f.collections[1].variables.find((v) => v.name === 'type/body/fontFamily')!;
    expect(family).toEqual({ name: 'type/body/fontFamily', type: 'STRING', values: { Light: { alias: 'font/family/sans' }, Dark: { alias: 'font/family/sans' } } });
    const size = f.collections[1].variables.find((v) => v.name === 'type/body/fontSize')!;
    expect(size).toEqual({ name: 'type/body/fontSize', type: 'FLOAT', values: { Light: { alias: 'type/size/16' }, Dark: { alias: 'type/size/16' } } });
  });
});
