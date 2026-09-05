import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = new URL('../../../', import.meta.url).pathname;
const out = join(root, 'packages/mcp/dist/data');
mkdirSync(join(out, 'tokens'), { recursive: true });
mkdirSync(join(out, 'figma'), { recursive: true });

// components.manifest.json and llms.txt land in Task 2 — skip them (with a
// warning) rather than fail the build until they exist.
//
// theme.css is bundled too: check-usage.ts reads it to build the closed-theme
// key set, and the published package layout has no monorepo root to find it
// at its usual `packages/ui/src/tokens/theme.css` path — so it's copied here
// at that same relative path under `dist/data`, which is exactly where
// `findRoot()` points a published install.
for (const f of [
  'tokens/primitives.tokens.json',
  'tokens/semantic.light.tokens.json',
  'tokens/semantic.dark.tokens.json',
  'components.manifest.json',
  'llms.txt',
  'figma/library.json',
  'packages/ui/src/tokens/theme.css',
]) {
  const src = join(root, f);
  if (!existsSync(src)) {
    console.warn(`copy-data: skipping missing ${f}`);
    continue;
  }
  const dest = join(out, f);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}
console.log('copied data');
