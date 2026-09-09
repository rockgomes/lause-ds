import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

/**
 * Builds the package once before any test in this project runs. Several
 * tests need `dist/` (the stdio entry) and `dist/data/bundle.json`, which
 * the Netlify function (and the esbuild bundle test) import. Doing it here
 * instead of in a `beforeAll` means a fresh clone cannot race: no test file
 * starts until the build has finished, and the build runs exactly once.
 */
export default function setup(): void {
  execSync('npm run build:mcp', { cwd: repoRoot, stdio: 'inherit' });
}
