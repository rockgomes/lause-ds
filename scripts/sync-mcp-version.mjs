// Keeps packages/mcp/src/version.ts equal to packages/mcp/package.json.
// `changeset version` bumps the package.json; this runs right after it so
// the constant the server reports (and version.test.ts guards) moves too.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'packages/mcp/package.json'), 'utf8'));
const file = join(root, 'packages/mcp/src/version.ts');
const src = readFileSync(file, 'utf8');
const next = src.replace(/VERSION = '[^']*'/, `VERSION = '${pkg.version}'`);
if (next !== src) {
  writeFileSync(file, next);
  console.log(`version.ts -> ${pkg.version}`);
}
