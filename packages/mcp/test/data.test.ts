import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { dataFromBundle, findRoot, loadData, resolveToken, type Bundle } from '../src/data.js';
import { getComponent } from '../src/tools.js';

/**
 * Builds a `Bundle` the way `copy-data.mjs` does, but reading straight from
 * the repo instead of writing `dist/data/bundle.json` — this is what proves
 * `dataFromBundle` produces the same `Data` the filesystem-backed `loadData`
 * does, without needing a build step in this test.
 */
function buildTestBundle(root: string): Bundle {
  const readJson = (rel: string) => JSON.parse(readFileSync(join(root, rel), 'utf8'));
  const sources: Bundle['sources'] = {};
  const uiSrc = join(root, 'packages/ui/src');
  for (const entry of readdirSync(uiSrc, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    let source: string | null = null;
    for (const suffix of ['.tsx', '.ts']) {
      const p = join(uiSrc, name, `${name}${suffix}`);
      if (existsSync(p)) {
        source = readFileSync(p, 'utf8');
        break;
      }
    }
    if (source === null) continue; // e.g. Foundations, which has no main source file
    const storiesPath = join(uiSrc, name, `${name}.stories.tsx`);
    sources[name] = { source, stories: existsSync(storiesPath) ? readFileSync(storiesPath, 'utf8') : null };
  }
  return {
    primitives: readJson('tokens/primitives.tokens.json'),
    light: readJson('tokens/semantic.light.tokens.json'),
    dark: readJson('tokens/semantic.dark.tokens.json'),
    manifest: readJson('components.manifest.json'),
    llms: readFileSync(join(root, 'llms.txt'), 'utf8'),
    figma: readJson('figma/library.json'),
    themeCss: readFileSync(join(root, 'packages/ui/src/tokens/theme.css'), 'utf8'),
    sources,
  };
}

describe('dataFromBundle', () => {
  const root = findRoot();
  const bundle = buildTestBundle(root);
  const fromBundle = dataFromBundle(bundle);
  const fromDisk = loadData(root);

  it('matches loadData for tokens and the manifest', () => {
    expect(fromBundle.primitives).toEqual(fromDisk.primitives);
    expect(fromBundle.light).toEqual(fromDisk.light);
    expect(fromBundle.dark).toEqual(fromDisk.dark);
    expect(fromBundle.manifest).toEqual(fromDisk.manifest);
  });

  it('getComponent reads the same source text as the filesystem-backed data', () => {
    const bundleResult = getComponent(fromBundle, 'Button');
    const diskResult = getComponent(fromDisk, 'Button', root);
    if ('isError' in bundleResult || 'isError' in diskResult) throw new Error('expected Button to resolve');
    expect(bundleResult.sourceText).toBe(diskResult.sourceText);
  });

  it('getComponent serves alias components from the bundle', () => {
    const bundleResult = getComponent(fromBundle, 'TileStack');
    if ('isError' in bundleResult) throw new Error('expected TileStack to resolve');
    expect(bundleResult.sourceText).toContain('export function TileStack');
    expect(bundleResult.sourceText).toBe(getComponent(fromBundle, 'Tile').sourceText);
  });
});

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
