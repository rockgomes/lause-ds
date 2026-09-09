import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateManifest, renderLlms } from '../src/manifest.js';
import { loadData } from '../src/data.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const manifest = generateManifest(root);

describe('manifest', () => {
  it('lists every export of packages/ui as a component or hook', () => {
    const names = manifest.components.map((c) => c.name).sort();
    expect(names).toEqual(['Bar', 'Bubble', 'Button', 'Cell', 'CellGrid', 'Dial', 'Keycap', 'Nav', 'Progress', 'Sentence', 'Tile', 'TileStack', 'usePeek']);
  });
  it('reads props, types, defaults and JSDoc from the source', () => {
    const button = manifest.components.find((c) => c.name === 'Button')!;
    const variant = button.props.find((p) => p.name === 'variant')!;
    expect(variant.type).toBe("'filled' | 'outline' | 'dim'");
    expect(variant.required).toBe(false);
    expect(variant.default).toBe("'filled'");
    expect(variant.doc).toMatch(/primary action/);
    expect(button.summary).toMatch(/pill button/i);
  });
  it('reads the states from the stories', () => {
    const tile = manifest.components.find((c) => c.name === 'Tile')!;
    expect(tile.states).toEqual(expect.arrayContaining(['Idle', 'Selected', 'Filled', 'Dimmed', 'Dark']));
  });
  it('joins the Figma set id and the proof screen', () => {
    const cell = manifest.components.find((c) => c.name === 'Cell')!;
    expect(cell.figma?.setId).toBe('16:101');
    expect(cell.proofScreen).toBe('Õigused');
  });
  it('matches the committed file (run npm run build:manifest if this fails)', () => {
    expect(JSON.parse(readFileSync(root + 'components.manifest.json', 'utf8'))).toEqual(manifest);
  });
  it('gives TileStack and CellGrid the rules of the component they hold', () => {
    const byName = (name: string) => manifest.components.find((c) => c.name === name)!;
    expect(byName('TileStack').rules).toEqual(byName('Tile').rules);
    expect(byName('CellGrid').rules).toEqual(byName('Cell').rules);
  });
});

describe('llms.txt', () => {
  const txt = renderLlms(manifest, loadData(root));

  it('opens with the title and tells the reader how to install and import', () => {
    expect(txt.startsWith('# Lause design system')).toBe(true);
    expect(txt).toContain('## Install and import');
    expect(txt).toContain('npm install lause-ds');
    expect(txt).toContain("@import 'lause-ds/styles.css';");
    expect(txt).toContain('requires Tailwind v4');
    expect(txt).toContain("Every component already carries `'use client'`");
  });

  it('gives every token its utility and its custom property', () => {
    expect(txt).toContain(
      'color.ink: #0f2238 (light) · #e3ecf7 (dark) | bg-ink / text-ink · --lause-color-ink | text, filled controls',
    );
    expect(txt).toContain('font.content: Young Serif, Georgia, serif (light)');
    expect(txt).toContain('font-content · --lause-font-content');
    expect(txt).toContain('type.body: fontFamily Instrument Sans');
    expect(txt).toContain('text-body · --lause-type-body-size');
  });

  it('renders a shadow as the CSS shorthand', () => {
    expect(txt).toContain('shadow.tile: 0px 6px 18px 0px rgba(15, 34, 56, 0.10) (light)');
  });

  it('separates the doc from the rest of the line with the same bar the token lines use, whether the prop has a default or not', () => {
    // With a default: the doc text is itself a colon-delimited list of the enum values.
    expect(txt).toContain(
      "- variant?: 'filled' | 'outline' | 'dim' = 'filled' | filled: the one primary action. outline: secondary. dim: tertiary, text only.",
    );
    // Without a default: the doc text also contains a colon of its own.
    expect(txt).toContain('- total: number | Number of units: sentences, cards, questions, arrows.');
  });

  it('puts each component under ## Components as a ### heading', () => {
    expect(txt).toContain('## Components');
    expect(txt).toMatch(/\n### Button\n/);
    expect(txt).toMatch(/\n#### Props\n/);
  });

  it('matches the committed file (run npm run build:manifest if this fails)', () => {
    expect(readFileSync(root + 'llms.txt', 'utf8')).toBe(txt);
  });
});
