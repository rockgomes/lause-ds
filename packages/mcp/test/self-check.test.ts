import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkUsage } from '../src/check-usage.js';
import { loadData } from '../src/data.js';

// Every .ts/.tsx under packages/ui/src except stories and generated tokens.
function componentSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'tokens' ? [] : componentSources(full);
    return (name.endsWith('.tsx') || name.endsWith('.ts')) && !name.endsWith('.stories.tsx') ? [full] : [];
  });
}

// Same repo-root construction as manifest.test.ts, so loadData reads the
// workspace's own tokens and manifest rather than a published copy.
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

describe('the library passes its own check_usage', () => {
  const data = loadData(repoRoot);
  const root = join(import.meta.dirname, '../../ui/src');
  for (const file of componentSources(root)) {
    it(`${file.slice(root.length + 1)} has no findings`, () => {
      const { findings } = checkUsage(data, readFileSync(file, 'utf8'));
      expect(findings.map((f) => `${f.rule} line ${f.line}: ${f.excerpt}`)).toEqual([]);
    });
  }
});
