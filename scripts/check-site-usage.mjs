// The site dogfoods its own design system's usage rules: every `.tsx` file under
// `packages/site/src` is run through the same `check_usage` the MCP server exposes
// (`list_tokens` / `get_component` / `check_usage` — Task 7's Ask section calls the hosted
// version of this over HTTP). This script calls it locally, from the *built* `lause-ds-mcp`
// package, so it exercises exactly what a consumer would get — not the TypeScript source.
//
// `checkUsage` is not part of `lause-ds-mcp`'s public `exports` map (only `.` and `./data` are)
// — it is loaded by an explicit relative path into `node_modules/lause-ds-mcp/dist`, which
// resolves as a filesystem path rather than a package-subpath import and so is not subject to
// the `exports` restriction. `loadData` *is* exported at `lause-ds-mcp/data` and is used normally.
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData } from 'lause-ds-mcp/data';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkUsageModule = join(root, 'node_modules/lause-ds-mcp/dist/check-usage.js');
const { checkUsage } = await import(`file://${checkUsageModule}`);

const data = loadData();
const files = globSync(join(root, 'packages/site/src/**/*.tsx'));

let findingCount = 0;
for (const file of files.sort()) {
  const code = readFileSync(file, 'utf8');
  const { findings } = checkUsage(data, code);
  const relPath = relative(root, file);
  for (const finding of findings) {
    findingCount++;
    console.log(`${relPath}:${finding.line} ${finding.rule} ${finding.message}`);
  }
}

if (findingCount > 0) {
  console.error(`\ncheck:site — ${findingCount} finding${findingCount === 1 ? '' : 's'} across ${files.length} file${files.length === 1 ? '' : 's'}.`);
  process.exit(1);
}

console.log(`check:site — clean (${files.length} file${files.length === 1 ? '' : 's'} checked).`);
