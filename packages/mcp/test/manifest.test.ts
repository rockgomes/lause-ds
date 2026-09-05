import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateManifest, renderLlms } from '../src/manifest.js';
import { loadData } from '../src/data.js';

const root = new URL('../../../', import.meta.url).pathname;
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
  it('renders llms.txt with the tokens and the components', () => {
    const txt = renderLlms(manifest, loadData(root));
    expect(txt.startsWith('# Lause design system')).toBe(true);
    expect(txt).toContain('color.ink: #0f2238 (light) · #e3ecf7 (dark)');
    expect(txt).toMatch(/## Button/);
  });
});
