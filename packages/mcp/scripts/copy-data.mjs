import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
//
// Every one of these files is also read into `bundle.json` below (as parsed
// JSON or raw text, `null` when missing) — the hosted Netlify function reads
// that bundle instead of discovering these files on disk at runtime, since
// the deployed esbuild bundle has neither a monorepo root nor these paths.
const FILES = [
  'tokens/primitives.tokens.json',
  'tokens/semantic.light.tokens.json',
  'tokens/semantic.dark.tokens.json',
  'components.manifest.json',
  'llms.txt',
  'figma/library.json',
  'packages/ui/src/tokens/theme.css',
];

const raw = {};
for (const f of FILES) {
  const src = join(root, f);
  if (!existsSync(src)) {
    console.warn(`copy-data: skipping missing ${f}`);
    raw[f] = null;
    continue;
  }
  const dest = join(out, f);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  raw[f] = readFileSync(src, 'utf8');
}

function parseOrNull(text) {
  return text === null ? null : JSON.parse(text);
}

const bundle = {
  primitives: parseOrNull(raw['tokens/primitives.tokens.json']),
  light: parseOrNull(raw['tokens/semantic.light.tokens.json']),
  dark: parseOrNull(raw['tokens/semantic.dark.tokens.json']),
  manifest: parseOrNull(raw['components.manifest.json']),
  llms: raw['llms.txt'],
  figma: parseOrNull(raw['figma/library.json']),
  themeCss: raw['packages/ui/src/tokens/theme.css'],
  sources: {},
};

// getComponent reads a component's source and story text straight off disk
// (packages/ui/src/<Name>/<Name>.tsx and <Name>.stories.tsx) — a published
// install has no monorepo to find those in, so they're bundled here too, at
// the same relative path `findRoot()` resolves to in that layout, and their
// text is also recorded into `bundle.sources` so the hosted function never
// needs to read them off disk at all. Missing files (a directory with no
// matching source, e.g. a foundations page) are skipped with the same
// warning style as above; getComponent falls back to a placeholder string
// for whatever doesn't make it into the bundle.
//
// The main source file is usually `<Name>.tsx`, but a hook like usePeek has
// no JSX and lives in `<Name>.ts` instead — try `.tsx` first, then fall back
// to `.ts`.
const uiSrc = join(root, 'packages/ui/src');
if (existsSync(uiSrc)) {
  for (const entry of readdirSync(uiSrc, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;

    let sourceText = null;
    for (const suffix of ['.tsx', '.ts']) {
      const rel = `packages/ui/src/${name}/${name}${suffix}`;
      const src = join(root, rel);
      if (!existsSync(src)) continue;
      const dest = join(out, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest);
      sourceText = readFileSync(src, 'utf8');
      break;
    }
    if (sourceText === null) {
      console.warn(`copy-data: skipping missing packages/ui/src/${name}/${name}.tsx`);
      continue; // no main source at all — no bundle entry for this directory
    }

    const storiesRel = `packages/ui/src/${name}/${name}.stories.tsx`;
    const storiesSrc = join(root, storiesRel);
    let storiesText = null;
    if (!existsSync(storiesSrc)) {
      console.warn(`copy-data: skipping missing ${storiesRel}`);
    } else {
      const storiesDest = join(out, storiesRel);
      mkdirSync(dirname(storiesDest), { recursive: true });
      cpSync(storiesSrc, storiesDest);
      storiesText = readFileSync(storiesSrc, 'utf8');
    }

    bundle.sources[name] = { source: sourceText, stories: storiesText };
  }
}

writeFileSync(join(out, 'bundle.json'), JSON.stringify(bundle));

console.log('copied data');
