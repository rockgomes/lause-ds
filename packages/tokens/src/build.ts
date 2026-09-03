import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScales, type ScaleRules } from './scales.js';
import { buildColors, type Anchors } from './ramps.js';
import { emitTokensCss, emitThemeCss } from './emit-css.js';
import { emitFigmaVariables } from './emit-figma.js';
import { checkPairs, type Pair } from './contrast.js';
import type { Group } from './dtcg.js';

function readJson<T>(p: string): T { return JSON.parse(readFileSync(p, 'utf8')) as T; }
function write(p: string, content: string): string { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); return p; }

export async function build(root: string): Promise<string[]> {
  const src = join(root, 'tokens');
  const colors = buildColors(readJson<Anchors>(join(src, 'src/anchors.json')));
  const prim: Group = { ...buildScales(readJson<ScaleRules>(join(src, 'src/scales.json')), colors), ...colors };
  const light = readJson<Group>(join(src, 'semantic.light.tokens.json'));
  const dark = readJson<Group>(join(src, 'semantic.dark.tokens.json'));

  const pairs = readJson<Pair[]>(join(src, 'src/contrast-pairs.json'));
  const failing = [...checkPairs(pairs, light, prim), ...checkPairs(pairs, dark, prim)].filter((r) => !r.ok);
  if (failing.length) throw new Error('contrast failures:\n' + failing.map((r) => `  ${r.fg} on ${r.bg} = ${r.ratio.toFixed(2)} < ${r.min} (${r.use})`).join('\n'));

  return [
    write(join(src, 'primitives.tokens.json'), JSON.stringify(prim, null, 2) + '\n'),
    write(join(root, 'packages/ui/src/tokens/tokens.css'), emitTokensCss(prim, light, dark)),
    write(join(root, 'packages/ui/src/tokens/theme.css'), emitThemeCss(prim, light)),
    write(join(root, 'figma/variables.json'), JSON.stringify(emitFigmaVariables(prim, light, dark), null, 2) + '\n'),
  ];
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  build(root).then((files) => console.log('wrote\n  ' + files.join('\n  '))).catch((e) => { console.error(e.message); process.exit(1); });
}
