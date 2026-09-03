# Lause DS — Plan 1: Foundation and Tokens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A repo with CI, and a token pipeline that turns hand-written anchors and scale rules into W3C token JSON, CSS custom properties for light and dark, a Tailwind v4 theme file, and a Figma variables file, with WCAG contrast checked by tests.

**Architecture:** `tokens/src/*.json` is the only hand-written input (colour anchors, scale rules, semantic aliases). `packages/tokens` is a small TypeScript build tool with one module per concern: scales, colour ramps, DTCG helpers, contrast, CSS emitter, Figma emitter, and a CLI that runs them in order. Generated files are committed so consumers never need the tool.

**Tech Stack:** Node 24, npm workspaces, TypeScript 5, vitest, tsx, culori (OKLCH conversion, gamut clamping, WCAG contrast), GitHub Actions.

**Spec:** `docs/specs/2026-09-03-lause-ds-design.md` — §2 decisions 3, 6, 10; §3 tokens.

**Roadmap (later plans, not here):** Plan 2 components + Storybook + axe + changesets; Plan 3 Figma library via the Figma MCP; Plan 4 MCP server on Netlify Functions; Plan 5 docs site and release.

## Global Constraints

- Node `24` (`.nvmrc`), npm workspaces, TypeScript strict, ESM only (`"type": "module"`).
- Token format is W3C DTCG JSON: every leaf has `$type` and `$value`; aliases are `"{group.path}"` strings.
- Colour ramps are generated from anchors, never typed. Type sizes come from base `16` × ratio `1.2`, rounded to whole px; hand tunings live only in `tokens/src/scales.json` under `tuned` with a note.
- Semantic tokens point at ramp steps or other tokens, never at raw values.
- Contrast: text pairs ≥ 4.5:1, graphic pairs ≥ 3:1, in both modes. A failing pair fails `npm test`.
- Generated outputs are committed: `tokens/primitives.tokens.json`, `packages/ui/src/tokens/tokens.css`, `packages/ui/src/tokens/theme.css`, `figma/variables.json`.
- Commit messages: conventional (`feat:`, `test:`, `chore:`, `docs:`), each ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Docs in English. No app chrome here.

---

## File structure

```
.nvmrc                                  "24"
package.json                            private root, workspaces, scripts
tsconfig.base.json                      strict, ESM, bundler resolution
vitest.config.ts                        runs every package's tests (projects)
.github/workflows/ci.yml                install, build tokens, test, fail on drift
tokens/src/anchors.json                 the three hue anchors + white/black
tokens/src/scales.json                  type ratio, space, radius, leading, opacity, shadow, fonts
tokens/semantic.light.tokens.json       hand-written aliases, light
tokens/semantic.dark.tokens.json        hand-written aliases, dark
tokens/primitives.tokens.json           GENERATED
packages/tokens/package.json            @lause-ds/tokens (private tool)
packages/tokens/tsconfig.json
packages/tokens/src/dtcg.ts             types, flatten, resolve
packages/tokens/src/scales.ts           buildScales(): non-colour primitives
packages/tokens/src/ramps.ts            buildRamp(): 11-step colour ramp from an anchor
packages/tokens/src/contrast.ts         checkPairs(): WCAG pairs per mode
packages/tokens/src/emit-css.ts         tokens.css + theme.css
packages/tokens/src/emit-figma.ts       figma/variables.json
packages/tokens/src/build.ts            CLI: read sources, write outputs
packages/tokens/test/*.test.ts
packages/ui/src/tokens/tokens.css       GENERATED
packages/ui/src/tokens/theme.css        GENERATED
figma/variables.json                    GENERATED
```

---

### Task 1: Repo tooling and CI

**Files:**
- Create: `.nvmrc`, `package.json`, `tsconfig.base.json`, `vitest.config.ts`, `.github/workflows/ci.yml`, `packages/tokens/package.json`, `packages/tokens/tsconfig.json`, `packages/tokens/test/smoke.test.ts`

**Interfaces:**
- Produces: `npm test` (vitest across workspaces), `npm run build:tokens` (defined in Task 8; a placeholder script that exits 0 until then), CI that runs both.

- [ ] **Step 1: Write the root files**

`.nvmrc`:
```
24
```

`package.json`:
```json
{
  "name": "lause-ds",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "vitest run",
    "build:tokens": "npm run build --workspace @lause-ds/tokens",
    "typecheck": "tsc -b packages/tokens"
  },
  "devDependencies": {
    "typescript": "latest",
    "vitest": "latest",
    "tsx": "latest"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { projects: ['packages/*'] },
});
```
(`test.projects` is the vitest 3.2+ form; if the installed vitest is older than 3.2, use a `vitest.workspace.ts` exporting `['packages/*']` instead and note it.)

`packages/tokens/package.json`:
```json
{
  "name": "@lause-ds/tokens",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsx src/build.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "culori": "latest"
  }
}
```

`packages/tokens/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "types": ["node"] },
  "include": ["src"]
}
```

- [ ] **Step 2: Install, replacing `latest` with the resolved versions**

Run:
```bash
cd /Users/rockgomes/Dev/lause-ds && npm install && npm install -D @types/node @types/culori
```
Then open `package.json` and `packages/tokens/package.json` and replace each `"latest"` with the version npm resolved (read them from `node_modules/<pkg>/package.json`). Record the versions in the task report. If `@types/culori` does not exist at the resolved culori version, add `packages/tokens/src/culori.d.ts` containing `declare module 'culori';` and note it.

- [ ] **Step 3: Write a smoke test**

`packages/tokens/test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('workspace', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 5: Write the CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run build:tokens
      - name: fail if generated files drifted
        run: git diff --exit-code -- tokens packages/ui/src/tokens figma
      - run: npm test
```

Until Task 8 exists, `build:tokens` must not fail: create `packages/tokens/src/build.ts` with the single line `console.log('build: not yet');`.

- [ ] **Step 6: Commit**

```bash
git checkout -b feat/foundation
git add -A
git commit -m "chore: workspace, TypeScript, vitest and CI

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: DTCG helpers

**Files:**
- Create: `packages/tokens/src/dtcg.ts`, `packages/tokens/test/dtcg.test.ts`

**Interfaces:**
- Produces:
  - `type Token = { $type: string; $value: unknown; $description?: string }`
  - `type Group = { [key: string]: Token | Group }`
  - `flatten(group: Group): Map<string, Token>` — keys are dot paths (`color.navy.500`)
  - `isAlias(value: unknown): value is string` — true for `"{a.b.c}"`
  - `resolve(path: string, ...groups: Group[]): Token` — follows aliases across the given groups; throws `Error("unresolved alias {x}")` when a path is missing; throws on cycles.

- [ ] **Step 1: Write the failing tests**

`packages/tokens/test/dtcg.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { flatten, isAlias, resolve, type Group } from '../src/dtcg.js';

const prim: Group = {
  color: { navy: { '900': { $type: 'color', $value: '#0f2238' } } },
};
const sem: Group = {
  color: {
    ink: { $type: 'color', $value: '{color.navy.900}' },
    text: { $type: 'color', $value: '{color.ink}' },
    loop: { $type: 'color', $value: '{color.loop}' },
    missing: { $type: 'color', $value: '{color.nope}' },
  },
};

describe('dtcg', () => {
  it('flattens to dot paths', () => {
    expect([...flatten(prim).keys()]).toEqual(['color.navy.900']);
  });
  it('detects aliases', () => {
    expect(isAlias('{color.navy.900}')).toBe(true);
    expect(isAlias('#fff')).toBe(false);
  });
  it('resolves aliases across groups, transitively', () => {
    expect(resolve('color.text', sem, prim).$value).toBe('#0f2238');
  });
  it('throws on a missing path', () => {
    expect(() => resolve('color.missing', sem, prim)).toThrow('unresolved alias {color.nope}');
  });
  it('throws on a cycle', () => {
    expect(() => resolve('color.loop', sem, prim)).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run packages/tokens/test/dtcg.test.ts`
Expected: FAIL, cannot find module `../src/dtcg.js`.

- [ ] **Step 3: Implement**

`packages/tokens/src/dtcg.ts`:
```ts
export type Token = { $type: string; $value: unknown; $description?: string };
export type Group = { [key: string]: Token | Group };

export function isToken(v: unknown): v is Token {
  return typeof v === 'object' && v !== null && '$value' in v;
}

export function flatten(group: Group, prefix = ''): Map<string, Token> {
  const out = new Map<string, Token>();
  for (const [k, v] of Object.entries(group)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (isToken(v)) out.set(path, v);
    else for (const [p, t] of flatten(v as Group, path)) out.set(p, t);
  }
  return out;
}

export function isAlias(value: unknown): value is string {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

export function resolve(path: string, ...groups: Group[]): Token {
  const maps = groups.map((g) => flatten(g));
  const seen = new Set<string>();
  let current = path;
  for (;;) {
    if (seen.has(current)) throw new Error(`alias cycle at {${current}}`);
    seen.add(current);
    const token = maps.map((m) => m.get(current)).find((t) => t !== undefined);
    if (!token) throw new Error(`unresolved alias {${current}}`);
    if (!isAlias(token.$value)) return token;
    current = token.$value.slice(1, -1);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run packages/tokens/test/dtcg.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/src/dtcg.ts packages/tokens/test/dtcg.test.ts
git commit -m "feat(tokens): DTCG flatten and alias resolution

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Non-colour primitives from scale rules

**Files:**
- Create: `tokens/src/scales.json`, `packages/tokens/src/scales.ts`, `packages/tokens/test/scales.test.ts`

**Interfaces:**
- Consumes: `Group`, `Token` from Task 2.
- Produces: `buildScales(rules: ScaleRules): Group` returning groups `type.size`, `type.leading`, `space`, `radius`, `shadow`, `font.family`, `opacity`. Type sizes are keyed by their px value as strings (`"57"`), so semantic aliases read `{type.size.57}`.

- [ ] **Step 1: Write the source rules**

`tokens/src/scales.json`:
```json
{
  "type": {
    "base": 16,
    "ratio": 1.2,
    "stepsDown": 2,
    "stepsUp": 12,
    "tuned": {}
  },
  "leading": { "tight": 1.1, "snug": 1.3, "normal": 1.5, "open": 1.85 },
  "space": [0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192],
  "radius": { "none": 0, "sm": 4, "md": 10, "lg": 22, "pill": 999 },
  "shadow": {
    "low": "0 1px 3px rgba(15, 34, 56, 0.10)",
    "mid": "0 6px 18px rgba(15, 34, 56, 0.10)"
  },
  "font": {
    "serif": ["Young Serif", "Georgia", "serif"],
    "sans": ["Instrument Sans", "Helvetica Neue", "Arial", "sans-serif"]
  },
  "opacity": { "dim": 0.38, "faint": 0.18 }
}
```

`tuned` maps a generated size to a replacement, with a note, for example `"57": { "value": 56, "note": "…" }`. It is empty now.

- [ ] **Step 2: Write the failing test**

`packages/tokens/test/scales.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { flatten } from '../src/dtcg.js';

const rules = JSON.parse(readFileSync(new URL('../../../tokens/src/scales.json', import.meta.url), 'utf8')) as ScaleRules;

describe('scales', () => {
  it('builds the 16 × 1.2 type ramp, rounded', () => {
    const g = buildScales(rules);
    const sizes = Object.keys((g.type as any).size).map(Number);
    expect(sizes).toEqual([11, 13, 16, 19, 23, 28, 33, 40, 48, 57, 69, 83, 99, 119, 143]);
  });
  it('applies a tuning with its note', () => {
    const g = buildScales({ ...rules, type: { ...rules.type, tuned: { '57': { value: 56, note: 'reads heavy' } } } });
    const t = flatten(g).get('type.size.57')!;
    expect(t.$value).toEqual({ value: 56, unit: 'px' });
    expect(t.$description).toBe('reads heavy');
  });
  it('emits the other groups with DTCG types', () => {
    const f = flatten(buildScales(rules));
    expect(f.get('space.8')?.$value).toEqual({ value: 8, unit: 'px' });
    expect(f.get('radius.pill')?.$value).toEqual({ value: 999, unit: 'px' });
    expect(f.get('type.leading.open')?.$value).toBe(1.85);
    expect(f.get('font.family.serif')?.$value).toEqual(['Young Serif', 'Georgia', 'serif']);
    expect(f.get('opacity.dim')?.$value).toBe(0.38);
    expect(f.get('shadow.mid')?.$type).toBe('shadow');
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run packages/tokens/test/scales.test.ts`
Expected: FAIL, cannot find module `../src/scales.js`.

- [ ] **Step 4: Implement**

`packages/tokens/src/scales.ts`:
```ts
import type { Group, Token } from './dtcg.js';

export type ScaleRules = {
  type: { base: number; ratio: number; stepsDown: number; stepsUp: number; tuned: Record<string, { value: number; note: string }> };
  leading: Record<string, number>;
  space: number[];
  radius: Record<string, number>;
  shadow: Record<string, string>;
  font: Record<string, string[]>;
  opacity: Record<string, number>;
};

const px = (value: number, $description?: string): Token => ({ $type: 'dimension', $value: { value, unit: 'px' }, ...($description ? { $description } : {}) });

export function typeSizes(t: ScaleRules['type']): number[] {
  const out: number[] = [];
  for (let i = -t.stepsDown; i <= t.stepsUp; i++) out.push(Math.round(t.base * Math.pow(t.ratio, i)));
  return [...new Set(out)];
}

export function buildScales(rules: ScaleRules): Group {
  const size: Group = {};
  for (const s of typeSizes(rules.type)) {
    const tuned = rules.type.tuned[String(s)];
    size[String(s)] = tuned ? px(tuned.value, tuned.note) : px(s);
  }
  const leading: Group = Object.fromEntries(Object.entries(rules.leading).map(([k, v]) => [k, { $type: 'number', $value: v }]));
  const space: Group = Object.fromEntries(rules.space.map((v) => [String(v), px(v)]));
  const radius: Group = Object.fromEntries(Object.entries(rules.radius).map(([k, v]) => [k, px(v)]));
  const shadow: Group = Object.fromEntries(Object.entries(rules.shadow).map(([k, v]) => [k, { $type: 'shadow', $value: v }]));
  const family: Group = Object.fromEntries(Object.entries(rules.font).map(([k, v]) => [k, { $type: 'fontFamily', $value: v }]));
  const opacity: Group = Object.fromEntries(Object.entries(rules.opacity).map(([k, v]) => [k, { $type: 'number', $value: v }]));
  return { type: { size, leading }, space, radius, shadow, font: { family }, opacity };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run packages/tokens/test/scales.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add tokens/src/scales.json packages/tokens/src/scales.ts packages/tokens/test/scales.test.ts
git commit -m "feat(tokens): non-colour primitives from scale rules

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Colour ramps from anchors

**Files:**
- Create: `tokens/src/anchors.json`, `packages/tokens/src/ramps.ts`, `packages/tokens/test/ramps.test.ts`

**Interfaces:**
- Consumes: `Group`, `Token` from Task 2; `culori`.
- Produces: `buildRamp(anchorHex: string): Record<Step, string>` (11 hex strings, keys `'50'…'950'`), `nearestStep(anchorHex): Step`, `buildColors(anchors: Anchors): Group` returning `color.<hue>.<step>` plus `color.white`, `color.black`.

- [ ] **Step 1: Write the anchors**

`tokens/src/anchors.json`:
```json
{
  "hues": {
    "navy": "#0f2238",
    "ice": "#e4edf3",
    "coral": "#ff5a36"
  },
  "white": "#ffffff",
  "black": "#000000"
}
```

- [ ] **Step 2: Write the failing tests**

`packages/tokens/test/ramps.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { oklch, parse } from 'culori';
import { buildRamp, nearestStep, buildColors, STEPS } from '../src/ramps.js';
import { flatten } from '../src/dtcg.js';

const L = (hex: string) => oklch(parse(hex)!)!.l;

describe('ramps', () => {
  it('has 11 steps in order', () => {
    expect(Object.keys(buildRamp('#0f2238'))).toEqual(STEPS);
  });
  it('keeps the anchor exact at its nearest step', () => {
    expect(nearestStep('#0f2238')).toBe('900');
    expect(buildRamp('#0f2238')['900']).toBe('#0f2238');
    expect(nearestStep('#e4edf3')).toBe('100');
    expect(buildRamp('#e4edf3')['100']).toBe('#e4edf3');
    expect(nearestStep('#ff5a36')).toBe('500');
    expect(buildRamp('#ff5a36')['500']).toBe('#ff5a36');
  });
  it('gets darker as the step number grows', () => {
    const r = buildRamp('#ff5a36');
    for (let i = 1; i < STEPS.length; i++) expect(L(r[STEPS[i]])).toBeLessThan(L(r[STEPS[i - 1]]));
  });
  it('emits every step as a hex string', () => {
    for (const hex of Object.values(buildRamp('#e4edf3'))) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('builds the colour group', () => {
    const f = flatten(buildColors({ hues: { navy: '#0f2238' }, white: '#ffffff', black: '#000000' }));
    expect(f.get('color.navy.900')?.$value).toBe('#0f2238');
    expect(f.get('color.white')?.$value).toBe('#ffffff');
    expect(f.size).toBe(13);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run packages/tokens/test/ramps.test.ts`
Expected: FAIL, cannot find module `../src/ramps.js`.

- [ ] **Step 4: Implement**

`packages/tokens/src/ramps.ts`:
```ts
import { oklch, parse, formatHex, clampChroma } from 'culori';
import type { Group } from './dtcg.js';

export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
export type Step = (typeof STEPS)[number];

// Target lightness per step, and how much of the anchor's chroma each step keeps.
const LIGHTNESS: Record<Step, number> = { '50': 0.97, '100': 0.94, '200': 0.89, '300': 0.82, '400': 0.72, '500': 0.62, '600': 0.52, '700': 0.43, '800': 0.35, '900': 0.27, '950': 0.20 };
const CHROMA: Record<Step, number> = { '50': 0.15, '100': 0.25, '200': 0.45, '300': 0.70, '400': 0.90, '500': 1.0, '600': 1.0, '700': 0.90, '800': 0.80, '900': 0.70, '950': 0.55 };

export type Anchors = { hues: Record<string, string>; white: string; black: string };

export function nearestStep(anchorHex: string): Step {
  const l = oklch(parse(anchorHex)!)!.l;
  return STEPS.reduce((best, s) => (Math.abs(LIGHTNESS[s] - l) < Math.abs(LIGHTNESS[best] - l) ? s : best), STEPS[0]);
}

export function buildRamp(anchorHex: string): Record<Step, string> {
  const a = oklch(parse(anchorHex)!)!;
  const home = nearestStep(anchorHex);
  const baseChroma = (a.c ?? 0) / CHROMA[home];
  const out = {} as Record<Step, string>;
  for (const s of STEPS) {
    if (s === home) { out[s] = anchorHex.toLowerCase(); continue; }
    const c = clampChroma({ mode: 'oklch', l: LIGHTNESS[s], c: baseChroma * CHROMA[s], h: a.h }, 'oklch');
    out[s] = formatHex(c);
  }
  return out;
}

export function buildColors(anchors: Anchors): Group {
  const color: Group = {};
  for (const [hue, hex] of Object.entries(anchors.hues)) {
    const ramp = buildRamp(hex);
    color[hue] = Object.fromEntries(STEPS.map((s) => [s, { $type: 'color', $value: ramp[s] }]));
  }
  color.white = { $type: 'color', $value: anchors.white };
  color.black = { $type: 'color', $value: anchors.black };
  return { color };
}
```

If culori's `clampChroma` signature differs at the installed version, read `node_modules/culori/README.md` and adapt the call; the intent is "keep this OKLCH colour inside the sRGB gamut by reducing chroma".

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run packages/tokens/test/ramps.test.ts`
Expected: 5 passed. If `nearestStep` picks a different step for an anchor, adjust `LIGHTNESS` so the three anchors land on 900, 100 and 500, then re-run; note the change in the task report.

- [ ] **Step 6: Commit**

```bash
git add tokens/src/anchors.json packages/tokens/src/ramps.ts packages/tokens/test/ramps.test.ts
git commit -m "feat(tokens): OKLCH colour ramps generated from anchors

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Semantic tokens for light and dark

**Files:**
- Create: `tokens/semantic.light.tokens.json`, `tokens/semantic.dark.tokens.json`, `packages/tokens/test/semantic.test.ts`

**Interfaces:**
- Consumes: `flatten`, `resolve` from Task 2; `buildScales` (Task 3); `buildColors` (Task 4).
- Produces: the two semantic files, with identical key sets. Every leaf is an alias. Type roles are `typography` composites whose fields are aliases.

- [ ] **Step 1: Write the light file**

`tokens/semantic.light.tokens.json`:
```json
{
  "color": {
    "ground":      { "$type": "color", "$value": "{color.ice.100}",   "$description": "page background" },
    "ink":         { "$type": "color", "$value": "{color.navy.900}",  "$description": "text, filled controls" },
    "dim":         { "$type": "color", "$value": "{color.navy.600}",  "$description": "secondary text; solid so contrast is checkable" },
    "accent":      { "$type": "color", "$value": "{color.coral.500}", "$description": "graphic accent: underlines, current segment, lit edge" },
    "accent-text": { "$type": "color", "$value": "{color.coral.700}", "$description": "accent used as small text" },
    "surface":     { "$type": "color", "$value": "{color.white}",     "$description": "tiles" },
    "on-ink":      { "$type": "color", "$value": "{color.ice.100}",   "$description": "text on ink fills" }
  },
  "font": {
    "content": { "$type": "fontFamily", "$value": "{font.family.serif}" },
    "chrome":  { "$type": "fontFamily", "$value": "{font.family.sans}" }
  },
  "type": {
    "label":    { "$type": "typography", "$value": { "fontFamily": "{font.chrome}",  "fontSize": "{type.size.13}",  "lineHeight": "{type.leading.snug}",   "fontWeight": 600 } },
    "body":     { "$type": "typography", "$value": { "fontFamily": "{font.chrome}",  "fontSize": "{type.size.16}",  "lineHeight": "{type.leading.normal}", "fontWeight": 400 } },
    "title":    { "$type": "typography", "$value": { "fontFamily": "{font.chrome}",  "fontSize": "{type.size.19}",  "lineHeight": "{type.leading.snug}",   "fontWeight": 600 } },
    "reading":  { "$type": "typography", "$value": { "fontFamily": "{font.content}", "fontSize": "{type.size.57}",  "lineHeight": "{type.leading.open}",   "fontWeight": 400 } },
    "headline": { "$type": "typography", "$value": { "fontFamily": "{font.content}", "fontSize": "{type.size.83}",  "lineHeight": "{type.leading.tight}",  "fontWeight": 400 } },
    "display":  { "$type": "typography", "$value": { "fontFamily": "{font.content}", "fontSize": "{type.size.143}", "lineHeight": "{type.leading.tight}",  "fontWeight": 400 } }
  },
  "radius": {
    "control": { "$type": "dimension", "$value": "{radius.pill}" },
    "card":    { "$type": "dimension", "$value": "{radius.lg}" },
    "bubble":  { "$type": "dimension", "$value": "{radius.md}" }
  },
  "shadow": {
    "tile": { "$type": "shadow", "$value": "{shadow.mid}" }
  }
}
```

- [ ] **Step 2: Write the dark file**

`tokens/semantic.dark.tokens.json` — same keys; only the `color` group differs:
```json
{
  "color": {
    "ground":      { "$type": "color", "$value": "{color.navy.950}",  "$description": "page background" },
    "ink":         { "$type": "color", "$value": "{color.ice.100}",   "$description": "text, filled controls" },
    "dim":         { "$type": "color", "$value": "{color.ice.400}",   "$description": "secondary text; solid so contrast is checkable" },
    "accent":      { "$type": "color", "$value": "{color.coral.400}", "$description": "graphic accent" },
    "accent-text": { "$type": "color", "$value": "{color.coral.300}", "$description": "accent used as small text" },
    "surface":     { "$type": "color", "$value": "{color.navy.900}",  "$description": "tiles" },
    "on-ink":      { "$type": "color", "$value": "{color.navy.950}",  "$description": "text on ink fills" }
  },
  "font":   { "content": { "$type": "fontFamily", "$value": "{font.family.serif}" }, "chrome": { "$type": "fontFamily", "$value": "{font.family.sans}" } },
  "type": {
    "label":    { "$type": "typography", "$value": { "fontFamily": "{font.chrome}",  "fontSize": "{type.size.13}",  "lineHeight": "{type.leading.snug}",   "fontWeight": 600 } },
    "body":     { "$type": "typography", "$value": { "fontFamily": "{font.chrome}",  "fontSize": "{type.size.16}",  "lineHeight": "{type.leading.normal}", "fontWeight": 400 } },
    "title":    { "$type": "typography", "$value": { "fontFamily": "{font.chrome}",  "fontSize": "{type.size.19}",  "lineHeight": "{type.leading.snug}",   "fontWeight": 600 } },
    "reading":  { "$type": "typography", "$value": { "fontFamily": "{font.content}", "fontSize": "{type.size.57}",  "lineHeight": "{type.leading.open}",   "fontWeight": 400 } },
    "headline": { "$type": "typography", "$value": { "fontFamily": "{font.content}", "fontSize": "{type.size.83}",  "lineHeight": "{type.leading.tight}",  "fontWeight": 400 } },
    "display":  { "$type": "typography", "$value": { "fontFamily": "{font.content}", "fontSize": "{type.size.143}", "lineHeight": "{type.leading.tight}",  "fontWeight": 400 } }
  },
  "radius": { "control": { "$type": "dimension", "$value": "{radius.pill}" }, "card": { "$type": "dimension", "$value": "{radius.lg}" }, "bubble": { "$type": "dimension", "$value": "{radius.md}" } },
  "shadow": { "tile": { "$type": "shadow", "$value": "{shadow.mid}" } }
}
```

- [ ] **Step 3: Write the failing test**

`packages/tokens/test/semantic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { flatten, resolve, isAlias, type Group } from '../src/dtcg.js';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { buildColors, type Anchors } from '../src/ramps.js';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../../tokens/${p}`, import.meta.url), 'utf8'));
const prim: Group = { ...buildScales(read('src/scales.json') as ScaleRules), ...buildColors(read('src/anchors.json') as Anchors) };
const light: Group = read('semantic.light.tokens.json');
const dark: Group = read('semantic.dark.tokens.json');

describe('semantic tokens', () => {
  it('light and dark have the same keys', () => {
    expect([...flatten(light).keys()]).toEqual([...flatten(dark).keys()]);
  });
  it('every simple value is an alias that resolves', () => {
    for (const mode of [light, dark]) for (const [path, t] of flatten(mode)) {
      if (t.$type === 'typography') continue;
      expect(isAlias(t.$value), path).toBe(true);
      expect(() => resolve(path, mode, prim)).not.toThrow();
    }
  });
  it('typography fields resolve', () => {
    for (const mode of [light, dark]) for (const [path, t] of flatten(mode)) {
      if (t.$type !== 'typography') continue;
      const v = t.$value as Record<string, unknown>;
      for (const key of ['fontFamily', 'fontSize', 'lineHeight']) {
        expect(isAlias(v[key]), `${path}.${key}`).toBe(true);
        expect(() => resolve((v[key] as string).slice(1, -1), mode, prim)).not.toThrow();
      }
      expect(typeof v.fontWeight).toBe('number');
    }
  });
});
```

- [ ] **Step 4: Run to verify it fails, then passes**

Run: `npx vitest run packages/tokens/test/semantic.test.ts`
Expected: first run FAIL only if a file has a typo; fix and re-run until 3 passed. (The test has no implementation to write; it guards the two JSON files.)

- [ ] **Step 5: Commit**

```bash
git add tokens/semantic.light.tokens.json tokens/semantic.dark.tokens.json packages/tokens/test/semantic.test.ts
git commit -m "feat(tokens): semantic tokens for light and dark, all aliases

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Contrast check

**Files:**
- Create: `tokens/src/contrast-pairs.json`, `packages/tokens/src/contrast.ts`, `packages/tokens/test/contrast.test.ts`

**Interfaces:**
- Consumes: `resolve` (Task 2), `wcagContrast` from culori.
- Produces: `checkPairs(pairs: Pair[], semantic: Group, prim: Group): Result[]` where `Pair = { fg: string; bg: string; min: number; use: string }` and `Result = Pair & { ratio: number; ok: boolean }`.

- [ ] **Step 1: Write the pairs**

`tokens/src/contrast-pairs.json`:
```json
[
  { "fg": "color.ink",         "bg": "color.ground",  "min": 4.5, "use": "body text" },
  { "fg": "color.dim",         "bg": "color.ground",  "min": 4.5, "use": "secondary text" },
  { "fg": "color.accent-text", "bg": "color.ground",  "min": 4.5, "use": "small accent text" },
  { "fg": "color.accent",      "bg": "color.ground",  "min": 3.0, "use": "underlines, segments, edges" },
  { "fg": "color.ink",         "bg": "color.surface", "min": 4.5, "use": "tile text" },
  { "fg": "color.dim",         "bg": "color.surface", "min": 4.5, "use": "tile secondary text" },
  { "fg": "color.on-ink",      "bg": "color.ink",     "min": 4.5, "use": "text on filled buttons" },
  { "fg": "color.accent",      "bg": "color.ink",     "min": 3.0, "use": "accent on ink fills" }
]
```

- [ ] **Step 2: Write the failing test**

`packages/tokens/test/contrast.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { checkPairs, type Pair } from '../src/contrast.js';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { buildColors, type Anchors } from '../src/ramps.js';
import type { Group } from '../src/dtcg.js';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../../tokens/${p}`, import.meta.url), 'utf8'));
const prim: Group = { ...buildScales(read('src/scales.json') as ScaleRules), ...buildColors(read('src/anchors.json') as Anchors) };
const pairs = read('src/contrast-pairs.json') as Pair[];

describe('contrast', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`${mode}: every pair meets its minimum`, () => {
      const results = checkPairs(pairs, read(`semantic.${mode}.tokens.json`), prim);
      const failing = results.filter((r) => !r.ok).map((r) => `${r.fg} on ${r.bg} = ${r.ratio.toFixed(2)} < ${r.min} (${r.use})`);
      expect(failing).toEqual([]);
    });
  }
  it('reports a ratio for a known pair', () => {
    const [r] = checkPairs([{ fg: 'color.ink', bg: 'color.ground', min: 4.5, use: 't' }], read('semantic.light.tokens.json'), prim);
    expect(r.ratio).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run packages/tokens/test/contrast.test.ts`
Expected: FAIL, cannot find module `../src/contrast.js`.

- [ ] **Step 4: Implement**

`packages/tokens/src/contrast.ts`:
```ts
import { wcagContrast } from 'culori';
import { resolve, type Group } from './dtcg.js';

export type Pair = { fg: string; bg: string; min: number; use: string };
export type Result = Pair & { ratio: number; ok: boolean };

export function checkPairs(pairs: Pair[], semantic: Group, prim: Group): Result[] {
  return pairs.map((p) => {
    const fg = resolve(p.fg, semantic, prim).$value as string;
    const bg = resolve(p.bg, semantic, prim).$value as string;
    const ratio = wcagContrast(fg, bg);
    return { ...p, ratio, ok: ratio >= p.min };
  });
}
```

- [ ] **Step 5: Run, and tune until it passes**

Run: `npx vitest run packages/tokens/test/contrast.test.ts`
Expected: 3 passed. If a pair fails, the fix is in the semantic file, not the test: move that token one step darker (light mode) or lighter (dark mode) — `dim` navy.600 → navy.700, `accent-text` coral.700 → coral.800, dark `dim` ice.400 → ice.300 — re-run, and record every move with its ratio in the task report and in `docs/specs/2026-09-03-lause-ds-design.md` §3 next to the token. Never lower a minimum.

- [ ] **Step 6: Commit**

```bash
git add tokens/src/contrast-pairs.json packages/tokens/src/contrast.ts packages/tokens/test/contrast.test.ts tokens/semantic.*.tokens.json docs/specs
git commit -m "feat(tokens): WCAG contrast check on every semantic pair, both modes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: CSS and Figma emitters

**Files:**
- Create: `packages/tokens/src/emit-css.ts`, `packages/tokens/src/emit-figma.ts`, `packages/tokens/test/emit.test.ts`

**Interfaces:**
- Consumes: `flatten`, `resolve`, `isAlias` (Task 2).
- Produces:
  - `emitTokensCss(prim: Group, light: Group, dark: Group): string` — `:root { --lause-<path>: … }` for every primitive and every light semantic, then `[data-theme="dark"] { … }` for dark semantics. Semantic values reference primitives with `var(--lause-…)`. Typography composites emit four properties: `--lause-type-reading-font`, `-size`, `-leading`, `-weight`.
  - `emitThemeCss(light: Group): string` — a Tailwind v4 `@theme inline { … }` block mapping `--color-<name>`, `--font-<name>`, `--radius-<name>`, `--shadow-<name>`, `--text-<role>`, `--text-<role>--line-height` to the `--lause-*` variables.
  - `emitFigmaVariables(prim: Group, light: Group, dark: Group): FigmaFile` where `FigmaFile = { collections: { name: string; modes: string[]; variables: { name: string; type: 'COLOR' | 'FLOAT' | 'STRING'; values: Record<string, string | number> }[] }[] }`. Two collections: `Primitives` (one mode `Value`) and `Semantic` (modes `Light`, `Dark`). Names use `/` (`color/navy/500`). Colours are hex strings; dimensions and numbers are floats; font families are strings (first family).
  - `cssName(path: string): string` — `color.navy.500` → `--lause-color-navy-500`.

- [ ] **Step 1: Write the failing tests**

`packages/tokens/test/emit.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitTokensCss, emitThemeCss, cssName } from '../src/emit-css.js';
import { emitFigmaVariables } from '../src/emit-figma.js';
import { buildScales, type ScaleRules } from '../src/scales.js';
import { buildColors, type Anchors } from '../src/ramps.js';
import type { Group } from '../src/dtcg.js';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../../tokens/${p}`, import.meta.url), 'utf8'));
const prim: Group = { ...buildScales(read('src/scales.json') as ScaleRules), ...buildColors(read('src/anchors.json') as Anchors) };
const light: Group = read('semantic.light.tokens.json');
const dark: Group = read('semantic.dark.tokens.json');

describe('emit css', () => {
  const css = emitTokensCss(prim, light, dark);
  it('names variables from paths', () => {
    expect(cssName('color.navy.500')).toBe('--lause-color-navy-500');
  });
  it('emits primitives with raw values', () => {
    expect(css).toContain('--lause-color-navy-900: #0f2238;');
    expect(css).toContain('--lause-type-size-57: 57px;');
    expect(css).toContain('--lause-font-family-serif: "Young Serif", Georgia, serif;');
  });
  it('emits semantics as var() references, light in :root and dark under data-theme', () => {
    expect(css).toMatch(/:root \{[^}]*--lause-color-ink: var\(--lause-color-navy-900\);/s);
    expect(css).toMatch(/\[data-theme="dark"\] \{[^}]*--lause-color-ink: var\(--lause-color-ice-100\);/s);
  });
  it('expands typography roles', () => {
    expect(css).toContain('--lause-type-reading-size: var(--lause-type-size-57);');
    expect(css).toContain('--lause-type-reading-weight: 400;');
  });
});

describe('emit theme', () => {
  const theme = emitThemeCss(light);
  it('maps tokens into a Tailwind v4 theme block', () => {
    expect(theme.startsWith('@theme inline {')).toBe(true);
    expect(theme).toContain('--color-ink: var(--lause-color-ink);');
    expect(theme).toContain('--font-content: var(--lause-font-content);');
    expect(theme).toContain('--text-reading: var(--lause-type-reading-size);');
    expect(theme).toContain('--text-reading--line-height: var(--lause-type-reading-leading);');
    expect(theme).toContain('--radius-control: var(--lause-radius-control);');
  });
});

describe('emit figma', () => {
  const f = emitFigmaVariables(prim, light, dark);
  it('has two collections with the right modes', () => {
    expect(f.collections.map((c) => [c.name, c.modes])).toEqual([['Primitives', ['Value']], ['Semantic', ['Light', 'Dark']]]);
  });
  it('carries colours as hex per mode', () => {
    const ink = f.collections[1].variables.find((v) => v.name === 'color/ink')!;
    expect(ink.type).toBe('COLOR');
    expect(ink.values).toEqual({ Light: '#0f2238', Dark: '#e4edf3' });
  });
  it('carries dimensions as floats', () => {
    const s = f.collections[0].variables.find((v) => v.name === 'type/size/57')!;
    expect(s).toEqual({ name: 'type/size/57', type: 'FLOAT', values: { Value: 57 } });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run packages/tokens/test/emit.test.ts`
Expected: FAIL, cannot find module `../src/emit-css.js`.

- [ ] **Step 3: Implement the CSS emitter**

`packages/tokens/src/emit-css.ts`:
```ts
import { flatten, isAlias, resolve, type Group, type Token } from './dtcg.js';

export function cssName(path: string): string {
  return `--lause-${path.replace(/\./g, '-')}`;
}

function raw(t: Token): string {
  const v = t.$value as any;
  if (t.$type === 'dimension') return `${v.value}${v.unit}`;
  if (t.$type === 'fontFamily') return (v as string[]).map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(', ');
  return String(v);
}

function ref(value: unknown): string {
  return isAlias(value) ? `var(${cssName(value.slice(1, -1))})` : String(value);
}

function semanticLines(group: Group): string[] {
  const lines: string[] = [];
  for (const [path, t] of flatten(group)) {
    if (t.$type === 'typography') {
      const v = t.$value as Record<string, unknown>;
      lines.push(`  ${cssName(path)}-font: ${ref(v.fontFamily)};`);
      lines.push(`  ${cssName(path)}-size: ${ref(v.fontSize)};`);
      lines.push(`  ${cssName(path)}-leading: ${ref(v.lineHeight)};`);
      lines.push(`  ${cssName(path)}-weight: ${v.fontWeight};`);
    } else {
      lines.push(`  ${cssName(path)}: ${ref(t.$value)};`);
    }
  }
  return lines;
}

export function emitTokensCss(prim: Group, light: Group, dark: Group): string {
  const primLines = [...flatten(prim)].map(([path, t]) => `  ${cssName(path)}: ${raw(t)};`);
  return [
    '/* generated by @lause-ds/tokens — do not edit */',
    ':root {',
    ...primLines,
    ...semanticLines(light),
    '}',
    '[data-theme="dark"] {',
    ...semanticLines(dark),
    '}',
    '',
  ].join('\n');
}

export function emitThemeCss(light: Group): string {
  const lines: string[] = [];
  for (const [path, t] of flatten(light)) {
    const [group, ...rest] = path.split('.');
    const name = rest.join('-');
    if (group === 'color') lines.push(`  --color-${name}: var(${cssName(path)});`);
    else if (group === 'font') lines.push(`  --font-${name}: var(${cssName(path)});`);
    else if (group === 'radius') lines.push(`  --radius-${name}: var(${cssName(path)});`);
    else if (group === 'shadow') lines.push(`  --shadow-${name}: var(${cssName(path)});`);
    else if (group === 'type' && t.$type === 'typography') {
      lines.push(`  --text-${name}: var(${cssName(path)}-size);`);
      lines.push(`  --text-${name}--line-height: var(${cssName(path)}-leading);`);
      lines.push(`  --text-${name}--font-weight: var(${cssName(path)}-weight);`);
    }
  }
  return ['@theme inline {', ...lines, '}', ''].join('\n');
}
```

- [ ] **Step 4: Implement the Figma emitter**

`packages/tokens/src/emit-figma.ts`:
```ts
import { flatten, resolve, type Group, type Token } from './dtcg.js';

export type FigmaVariable = { name: string; type: 'COLOR' | 'FLOAT' | 'STRING'; values: Record<string, string | number> };
export type FigmaCollection = { name: string; modes: string[]; variables: FigmaVariable[] };
export type FigmaFile = { collections: FigmaCollection[] };

function figmaValue(t: Token): { type: FigmaVariable['type']; value: string | number } | null {
  const v = t.$value as any;
  switch (t.$type) {
    case 'color': return { type: 'COLOR', value: v };
    case 'dimension': return { type: 'FLOAT', value: v.value };
    case 'number': return { type: 'FLOAT', value: v };
    case 'fontFamily': return { type: 'STRING', value: v[0] };
    case 'shadow': return { type: 'STRING', value: v };
    default: return null;
  }
}

const figmaName = (path: string) => path.replace(/\./g, '/');

export function emitFigmaVariables(prim: Group, light: Group, dark: Group): FigmaFile {
  const primitives: FigmaVariable[] = [];
  for (const [path, t] of flatten(prim)) {
    const fv = figmaValue(t);
    if (fv) primitives.push({ name: figmaName(path), type: fv.type, values: { Value: fv.value } });
  }
  const semantic: FigmaVariable[] = [];
  const darkMap = flatten(dark);
  for (const [path, t] of flatten(light)) {
    if (t.$type === 'typography') {
      const lv = t.$value as Record<string, string | number>;
      const dv = darkMap.get(path)!.$value as Record<string, string | number>;
      const part = (mode: Group, v: Record<string, string | number>, key: string) =>
        figmaValue(resolve(String(v[key]).slice(1, -1), mode, prim))!;
      for (const key of ['fontFamily', 'fontSize', 'lineHeight']) {
        const l = part(light, lv, key), d = part(dark, dv, key);
        semantic.push({ name: `${figmaName(path)}/${key}`, type: l.type, values: { Light: l.value, Dark: d.value } });
      }
      semantic.push({ name: `${figmaName(path)}/fontWeight`, type: 'FLOAT', values: { Light: lv.fontWeight, Dark: dv.fontWeight } });
      continue;
    }
    const l = figmaValue(resolve(path, light, prim))!;
    const d = figmaValue(resolve(path, dark, prim))!;
    semantic.push({ name: figmaName(path), type: l.type, values: { Light: l.value, Dark: d.value } });
  }
  return {
    collections: [
      { name: 'Primitives', modes: ['Value'], variables: primitives },
      { name: 'Semantic', modes: ['Light', 'Dark'], variables: semantic },
    ],
  };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run packages/tokens/test/emit.test.ts`
Expected: 9 passed.

- [ ] **Step 6: Commit**

```bash
git add packages/tokens/src/emit-css.ts packages/tokens/src/emit-figma.ts packages/tokens/test/emit.test.ts
git commit -m "feat(tokens): emit CSS custom properties, a Tailwind v4 theme, and Figma variables

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: The build CLI and committed outputs

**Files:**
- Modify: `packages/tokens/src/build.ts` (replace the placeholder)
- Create: `packages/tokens/test/build.test.ts`, `packages/ui/package.json`
- Generated: `tokens/primitives.tokens.json`, `packages/ui/src/tokens/tokens.css`, `packages/ui/src/tokens/theme.css`, `figma/variables.json`

**Interfaces:**
- Consumes: everything above.
- Produces: `build(root: string): Promise<string[]>` returning the written paths; `npm run build:tokens` at the root.

- [ ] **Step 1: Create the ui package shell**

`packages/ui/package.json`:
```json
{
  "name": "lause-ds",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Lause design system: tokens and components. Components arrive in Plan 2.",
  "files": ["src/tokens"]
}
```

- [ ] **Step 2: Write the failing test**

`packages/tokens/test/build.test.ts`:
```ts
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
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run packages/tokens/test/build.test.ts`
Expected: FAIL, `build` is not exported.

- [ ] **Step 4: Implement**

`packages/tokens/src/build.ts`:
```ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
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
  const prim: Group = { ...buildScales(readJson<ScaleRules>(join(src, 'src/scales.json'))), ...buildColors(readJson<Anchors>(join(src, 'src/anchors.json'))) };
  const light = readJson<Group>(join(src, 'semantic.light.tokens.json'));
  const dark = readJson<Group>(join(src, 'semantic.dark.tokens.json'));

  const pairs = readJson<Pair[]>(join(src, 'src/contrast-pairs.json'));
  const failing = [...checkPairs(pairs, light, prim), ...checkPairs(pairs, dark, prim)].filter((r) => !r.ok);
  if (failing.length) throw new Error('contrast failures:\n' + failing.map((r) => `  ${r.fg} on ${r.bg} = ${r.ratio.toFixed(2)} < ${r.min} (${r.use})`).join('\n'));

  return [
    write(join(src, 'primitives.tokens.json'), JSON.stringify(prim, null, 2) + '\n'),
    write(join(root, 'packages/ui/src/tokens/tokens.css'), emitTokensCss(prim, light, dark)),
    write(join(root, 'packages/ui/src/tokens/theme.css'), emitThemeCss(light)),
    write(join(root, 'figma/variables.json'), JSON.stringify(emitFigmaVariables(prim, light, dark), null, 2) + '\n'),
  ];
}

if (process.argv[1] && process.argv[1].endsWith('build.ts')) {
  const root = new URL('../../../', import.meta.url).pathname;
  build(root).then((files) => console.log('wrote\n  ' + files.join('\n  '))).catch((e) => { console.error(e.message); process.exit(1); });
}
```

- [ ] **Step 5: Run the test, then the real build**

Run: `npx vitest run packages/tokens/test/build.test.ts`
Expected: 1 passed.

Run: `npm run build:tokens`
Expected: `wrote` followed by the four paths. Open `packages/ui/src/tokens/tokens.css` and confirm it starts with the generated comment and contains both `:root` and `[data-theme="dark"]` blocks.

- [ ] **Step 6: Run everything**

Run: `npm test && npm run typecheck`
Expected: all green. If `typecheck` reports culori type gaps, add `packages/tokens/src/culori.d.ts` with `declare module 'culori';` and note it.

- [ ] **Step 7: Commit generated outputs with the build**

```bash
git add -A
git commit -m "feat(tokens): build CLI; commit generated primitives, CSS, theme and Figma variables

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: README and pull request

**Files:**
- Modify: `README.md` (Status and Layout sections), `docs/specs/2026-09-03-lause-ds-design.md` §3 (record any contrast tunings from Task 6)

- [ ] **Step 1: Update the README**

Replace the `## Status` section with:
```markdown
## Status

Foundation done: tokens build, light and dark modes, contrast checked in CI. Components next (Plan 2).

## Using the tokens today

```bash
npm run build:tokens   # regenerates tokens/primitives.tokens.json, packages/ui/src/tokens/*.css, figma/variables.json
npm test               # includes the WCAG contrast check on every semantic pair, both modes
```

Edit only `tokens/src/*.json` and `tokens/semantic.*.tokens.json`. Everything else under `tokens/`, `packages/ui/src/tokens/` and `figma/` is generated and CI fails if it drifts.
```

In `## Layout`, add `packages/tokens    the token build tool (private)` as a line.

- [ ] **Step 2: Commit and open the pull request**

```bash
git add README.md docs
git commit -m "docs: foundation status and how to use the tokens

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin feat/foundation
gh pr create --base main --head feat/foundation --title "feat: foundation — workspace, CI, and the token pipeline" --body "Plan 1 of the Lause design system.

- npm workspace, TypeScript, vitest, GitHub Actions CI (build, drift check, tests)
- tokens: OKLCH colour ramps from three anchors; type ramp 16 × 1.2 exposed as roles; space, radius, leading, shadow, fonts, opacity
- semantic tokens for light and dark, all aliases
- WCAG contrast check on every semantic pair in both modes, run in tests and in the build
- outputs committed: DTCG primitives, CSS custom properties, Tailwind v4 theme, Figma variables

Spec: docs/specs/2026-09-03-lause-ds-design.md · Plan: docs/superpowers/plans/2026-09-03-foundation-tokens.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 3: Confirm CI is green on the pull request**

Run: `gh pr checks --watch`
Expected: `ci / test` passes. If the drift check fails, run `npm run build:tokens`, commit the regenerated files, push.

---

## Self-review

**Spec coverage.** §3 primitives: ramps (Task 4), type/space/radius/leading/shadow/fonts/opacity (Task 3), tuning with notes (Task 3). §3 semantic tiers and type roles (Task 5). Decision 6 dark mode (Task 5, Task 7). Decision 10 contrast in CI (Task 6, Task 8, Task 1 workflow). "One script, three outputs" (Task 8; the DTCG primitives file is a fourth, committed for consumers). Figma import file for Plan 3 (Task 7). Decision 3 single source (Tasks 3–5 sources; drift check in Task 1). Not in this plan, by design: components, Storybook, axe, changesets, Figma library, MCP server, docs site, Netlify.

**Placeholders.** None: every step carries its file contents. Two conditional instructions exist on purpose (culori signature at the installed version; contrast tuning), each with the exact action to take.

**Type consistency.** `Group`, `Token`, `flatten`, `resolve`, `isAlias` (Task 2) are used unchanged in Tasks 3–8. `buildScales(ScaleRules)`, `typeSizes` (Task 3); `buildRamp`, `nearestStep`, `buildColors(Anchors)`, `STEPS` (Task 4); `checkPairs(Pair[], Group, Group): Result[]` (Task 6); `emitTokensCss`, `emitThemeCss`, `cssName` (Task 7); `emitFigmaVariables → FigmaFile` (Task 7); `build(root): Promise<string[]>` (Task 8). Type-size keys are px strings everywhere (`type.size.57`).
