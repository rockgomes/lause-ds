import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../src/build.js';

const repoRoot = new URL('../../../', import.meta.url).pathname;

describe('build', () => {
  it('writes the four outputs from the sources', async () => {
    const root = mkdtempSync(join(tmpdir(), 'lause-'));
    cpSync(join(repoRoot, 'tokens'), join(root, 'tokens'), { recursive: true });
    mkdirSync(join(root, 'packages/ui/src'), { recursive: true });
    const written = await build(root);
    expect(written.map((p) => p.replace(root + '/', ''))).toEqual([
      'tokens/primitives.tokens.json',
      'packages/ui/src/tokens/tokens.css',
      'packages/ui/src/tokens/theme.css',
      'figma/variables.json',
    ]);
    const prim = JSON.parse(readFileSync(join(root, 'tokens/primitives.tokens.json'), 'utf8'));
    expect(prim.color.navy['900'].$value).toBe('#0f2238');
    expect(existsSync(join(root, 'figma/variables.json'))).toBe(true);
  });
});
