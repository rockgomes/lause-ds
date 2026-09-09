// Fails when a Components card would link to a Storybook docs page that does not exist.
// The site builds each link as `/storybook/?path=/docs/<id>` where <id> is the lower-cased
// manifest name plus `--docs`; TileStack and CellGrid use the story of the master they compose.
// Keep FALLBACK in step with FIGMA_FALLBACK_NAME in packages/site/src/data/manifest.ts.
import { readFileSync } from 'node:fs';

const [indexPath = 'site/storybook/index.json', manifestPath = 'components.manifest.json'] = process.argv.slice(2);
const FALLBACK = { TileStack: 'Tile', CellGrid: 'Cell' };

const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const docsIds = new Set(Object.values(index.entries).filter((e) => e.type === 'docs').map((e) => e.id));

const missing = manifest.components
  .map((c) => ({ name: c.name, id: `${(FALLBACK[c.name] ?? c.name).toLowerCase()}--docs` }))
  .filter((link) => !docsIds.has(link.id));

if (missing.length > 0) {
  console.error(`check:storybook-links found ${missing.length} broken link${missing.length === 1 ? '' : 's'}:`);
  for (const m of missing) console.error(`  ${m.name} -> /storybook/?path=/docs/${m.id} (no such docs entry)`);
  process.exit(1);
}
console.log(`check:storybook-links is clean (${manifest.components.length} links checked).`);
