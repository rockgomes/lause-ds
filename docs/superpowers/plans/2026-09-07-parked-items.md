# Plan 7: the parked items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the items parked during Plans 3 to 6 so the design system is complete as a portfolio piece: the shared style constants become public, the Keycap passes the system's own usage check, the site's Storybook links are guarded against drift, every em dash on main goes and a CI gate keeps them out, and the Netlify rename is followed through.

**Architecture:** Five small, independent tasks on one branch `chore/parked-items`. Each task is a self-contained commit with its own test or gate. Tasks 1 and 2 change the published `lause-ds` package and carry changesets. Task 3 and Task 4 add CI gates as plain node scripts under `scripts/` beside `check-site-usage.mjs`. Task 5 waits for Rock to rename the Netlify project and then updates every URL.

**Tech Stack:** npm workspaces, TypeScript 7, vitest 4 (browser mode for `ui` and `site`, node for `mcp` and `tokens`), Tailwind 4 closed theme, changesets, GitHub Actions, Netlify.

**Spec:** `docs/specs/2026-09-03-lause-ds-design.md`. The parked items are listed at the end of the Plan 3, 5 and 6 sections of the project memory and in the PR 20 body ("Parked").

## Global Constraints

- The Tailwind theme is closed: only token utilities exist. CSS-variable utilities use the paren form `border-(length:--lause-stroke-thin)`. The bracket form `border-[length:…]` is ignored by Tailwind v4 and is a defect.
- No em dashes anywhere: code, comments, docs, commit messages, generated files, changesets. Use a comma, a colon, a full stop or brackets.
- Docs and comments in English. Only app copy is Estonian.
- Every commit ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Generated files (`packages/ui/src/tokens/*.css`, `figma/variables.json`, `components.manifest.json`, `llms.txt`) are committed and CI fails if they drift from their sources: after changing an emitter, run the build and commit the output.
- `lause-ds` public API changes need a changeset in `.changeset/` (`"lause-ds": minor` for new exports, `patch` for fixes). `lause-ds-mcp` changes need `"lause-ds-mcp": patch`.
- Run from the repo root. `npm test` runs every project. Single project: `npx vitest run --project ui`, `--project mcp`, `--project site`, `--project '@lause-ds/tokens'`. The `site` project needs `packages/ui/dist` (run `npm run build:ui` first).
- No subagents dispatched by implementers. No pushes by implementers.

---

### Task 1: Export the shared style constants from `lause-ds`

The site copies `focusRing`, `hitTarget` and `hoverFade` in `packages/site/src/styles.ts` because Plan 3 parked their export. Export them, and `disabledControl`, from the package and delete the copy.

**Files:**
- Modify: `packages/ui/src/index.ts` (add one export line)
- Modify: `packages/ui/src/styles.ts:6` (the comment has an em dash)
- Create: `packages/site/test/styles.test.tsx`
- Modify: `packages/site/src/sections/Install.tsx:5`, `packages/site/src/sections/Ask.tsx:6`, `packages/site/src/sections/Components.tsx:4`, `packages/site/src/sections/Hero.tsx:5` (import from `lause-ds` instead of `../styles.js`)
- Modify: `packages/site/src/sections/Hero.tsx:30-40` (`storybookLinkClasses` composes the exported constants)
- Delete: `packages/site/src/styles.ts`
- Create: `.changeset/export-styles.md`

**Interfaces:**
- Produces: `export { focusRing, disabledControl, hitTarget, hoverFade, type SurfaceState } from './styles.js'` in `lause-ds`. Values are the strings already in `packages/ui/src/styles.ts`.

- [ ] **Step 1: Write the failing test**

Create `packages/site/test/styles.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { disabledControl, focusRing, hitTarget, hoverFade } from 'lause-ds';

describe('lause-ds style constants', () => {
  it('exports the four shared class strings the site used to copy', () => {
    expect(focusRing).toBe('focus-visible:outline-(length:--lause-stroke-focus) focus-visible:outline-offset-2 focus-visible:outline-accent');
    expect(hitTarget).toBe('min-h-[44px]');
    expect(hoverFade).toBe('transition-colors duration-120 motion-reduce:transition-none');
    expect(disabledControl).toBe('disabled:cursor-not-allowed disabled:opacity-(--lause-opacity-dim)');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build:ui && npx vitest run --project site packages/site/test/styles.test.tsx`
Expected: FAIL. `lause-ds` has no export named `focusRing`.

- [ ] **Step 3: Export from the package**

Append to `packages/ui/src/index.ts`:

```ts
export { focusRing, disabledControl, hitTarget, hoverFade, type SurfaceState } from './styles.js';
```

In `packages/ui/src/styles.ts` change line 6 to:

```ts
/** WCAG 2.5.8 minimum target size, a rule, not a token. */
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run build:ui && npx vitest run --project site packages/site/test/styles.test.tsx`
Expected: PASS.

- [ ] **Step 5: Switch the site to the export and delete the copy**

In `Install.tsx`, `Ask.tsx`, `Components.tsx`, `Hero.tsx`: replace the `from '../styles.js'` import with the same names imported from `'lause-ds'` (merge into the existing `lause-ds` import line where one exists). In `Hero.tsx` replace the `storybookLinkClasses` block (the comment and the constant) with:

```ts
// Button has no `href` (ButtonProps = ComponentProps<'button'> & { variant?, keycap? }), so the
// Storybook link is a plain <a> styled to match Button's outline variant
// (packages/ui/src/Button/Button.tsx), with the `enabled:` variants dropped: `:enabled` never
// matches an anchor.
const storybookLinkClasses = clsx(
  'inline-flex items-center justify-center gap-8 rounded-control px-24 font-chrome text-body font-semibold',
  hitTarget,
  focusRing,
  hoverFade,
  'border-(length:--lause-stroke-thin) border-ink text-ink hover:bg-ground-hover active:bg-ground-hover',
);
```

Delete `packages/site/src/styles.ts`.

- [ ] **Step 6: Run the gates**

Run: `npm run typecheck && npm run check:site && npx vitest run --project site`
Expected: typecheck clean, `check:site is clean`, every site test passes. `git grep -n "styles.js" packages/site` prints nothing.

- [ ] **Step 7: Changeset and commit**

Create `.changeset/export-styles.md`:

```md
---
"lause-ds": minor
---

Export the shared class strings focusRing, disabledControl, hitTarget and hoverFade, and the SurfaceState type, so consumers style their own links and controls the way the components do.
```

```bash
git add packages/ui/src/index.ts packages/ui/src/styles.ts packages/site .changeset/export-styles.md
git commit -m "feat(ui): export the shared style constants; the site stops copying them"
```

---

### Task 2: The Keycap passes the system's own usage check

`packages/ui/src/Keycap/Keycap.tsx:17` carries `leading-none`. The closed theme resets `--leading-*`, so the class does nothing and `check_usage` flags the system's own component. Remove the class and add a test that runs `check_usage` over every component source so this cannot come back.

**Files:**
- Create: `packages/mcp/test/self-check.test.ts`
- Modify: `packages/ui/src/Keycap/Keycap.tsx:17`
- Create: `.changeset/keycap-leading.md`

**Interfaces:**
- Consumes: `checkUsage(data: Data, code: string): { findings: Finding[] }` from `packages/mcp/src/check-usage.ts`; `loadData()` from `packages/mcp/src/data.ts` (see how `packages/mcp/test/manifest.test.ts` loads data and copy that).

- [ ] **Step 1: Write the failing test**

Create `packages/mcp/test/self-check.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkUsage } from '../src/check-usage.js';
import { loadData } from '../src/data.js';

// Every .tsx under packages/ui/src except stories and generated tokens.
function componentSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'tokens' ? [] : componentSources(full);
    return name.endsWith('.tsx') && !name.endsWith('.stories.tsx') && !name.endsWith('.mdx') ? [full] : [];
  });
}

describe('the library passes its own check_usage', () => {
  const data = loadData();
  const root = join(import.meta.dirname, '../../ui/src');
  for (const file of componentSources(root)) {
    it(`${file.slice(root.length + 1)} has no findings`, () => {
      const { findings } = checkUsage(data, readFileSync(file, 'utf8'));
      expect(findings.map((f) => `${f.rule} line ${f.line}: ${f.excerpt}`)).toEqual([]);
    });
  }
});
```

If `loadData` takes arguments in this repo, copy the exact call from `packages/mcp/test/manifest.test.ts`.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --project mcp packages/mcp/test/self-check.test.ts`
Expected: exactly one failing case, `Keycap/Keycap.tsx`, with a `stem-without-role` or similar finding naming `leading-none`. If any other file fails, stop and report the findings in the report file; do not silence them.

- [ ] **Step 3: Remove the dead class**

In `packages/ui/src/Keycap/Keycap.tsx:17` delete ` leading-none` from the class string. The label role already sets the line height through `text-label`, so nothing changes visually.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run build:ui && npx vitest run --project mcp packages/mcp/test/self-check.test.ts && npx vitest run --project ui`
Expected: every self-check case passes; every Storybook story test (axe included) passes.

- [ ] **Step 5: Changeset and commit**

Create `.changeset/keycap-leading.md`:

```md
---
"lause-ds": patch
---

Keycap: drop a leading-none class the closed theme never defined. No visual change.
```

```bash
git add packages/mcp/test/self-check.test.ts packages/ui/src/Keycap/Keycap.tsx .changeset/keycap-leading.md
git commit -m "fix(ui): the Keycap passes check_usage; a test runs it over every component"
```

---

### Task 3: Guard the site's Storybook links against story-id drift

`packages/site/src/data/manifest.ts:59` builds `/storybook/?path=/docs/<name>--docs` from the manifest name, with `TileStack` and `CellGrid` falling back to `tile` and `cell`. A renamed story would silently break a card link. A CI script checks every link against the built Storybook index.

**Files:**
- Create: `scripts/check-storybook-links.mjs`
- Modify: `package.json` (root scripts: add `"check:storybook-links": "node scripts/check-storybook-links.mjs"`)
- Modify: `.github/workflows/ci.yml` (add `- run: npm run check:storybook-links` right after `- run: npm run check:site`)
- Modify: `packages/site/src/data/manifest.ts:41` (comment points at the script)

**Interfaces:**
- Consumes: `site/storybook/index.json` (Storybook 10 index: `{ entries: { [id]: { id, type: 'docs' | 'story', title, name } } }`) written by `npm run build:site`; `components.manifest.json` (`{ components: [{ name, … }] }`).

- [ ] **Step 1: Write the script**

Create `scripts/check-storybook-links.mjs`:

```js
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
```

- [ ] **Step 2: Run it against the real build**

Run: `npm run build:site && node scripts/check-storybook-links.mjs`
Expected: `check:storybook-links is clean (13 links checked).`

- [ ] **Step 3: Prove it fails on a broken link**

Write a fixture with a name that has no story:

```bash
node -e "const m=require('./components.manifest.json'); m.components.push({name:'Ghost'}); require('fs').writeFileSync('/tmp/claude-501/ghost.manifest.json', JSON.stringify(m))"
node scripts/check-storybook-links.mjs site/storybook/index.json /tmp/claude-501/ghost.manifest.json; echo "exit $?"
```

Expected: the line `Ghost -> /storybook/?path=/docs/ghost--docs (no such docs entry)` and `exit 1`.

- [ ] **Step 4: Wire it into the root scripts and CI**

Root `package.json` scripts: add `"check:storybook-links": "node scripts/check-storybook-links.mjs"` after `check:site`. In `.github/workflows/ci.yml` add `      - run: npm run check:storybook-links` on the line after `      - run: npm run check:site`. In `packages/site/src/data/manifest.ts` change the comment line `// Reused for both storybookUrl and figmaUrl below.` to `// Reused for both storybookUrl and figmaUrl below. scripts/check-storybook-links.mjs mirrors this map.`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-storybook-links.mjs package.json .github/workflows/ci.yml packages/site/src/data/manifest.ts
git commit -m "ci: check every Components card links to a Storybook docs page that exists"
```

---

### Task 4: No em dashes on main, and a gate that keeps it so

Main carries about 250 em dashes in older files: the llms.txt line format, the generated CSS headers, comments, READMEs, the spec and the older plan docs. Replace all of them and add a CI step that fails on any new one.

**Files:**
- Modify: `packages/mcp/src/manifest.ts:270,314,315,354,360` (the llms.txt format)
- Modify: `packages/mcp/test/manifest.test.ts:56` (expectation)
- Modify: `packages/tokens/src/emit-css.ts:47`, `packages/tokens/src/build.ts:30` (generated header), `packages/tokens/test/build.test.ts:33` (expectation)
- Regenerate: `llms.txt`, `packages/ui/src/tokens/tokens.css`, `packages/ui/src/tokens/theme.css`, `packages/ui/src/tokens/index.css`
- Modify: every other file `git grep -l $'\xe2\x80\x94' -- . ':!package-lock.json'` lists (the escape is the em dash byte sequence; the character itself may not appear in this repo) (comments, READMEs, docs, tests)
- Modify: `.github/workflows/ci.yml` (new step)
- Create: `.changeset/llms-format.md`

**Interfaces:**
- Produces: llms.txt token lines read `name: light (light) · dark (dark) | utility · custom property | description`. Prop lines read `name: type: doc`.

- [ ] **Step 1: Update the two test expectations first**

`packages/mcp/test/manifest.test.ts:56`:

```ts
      'color.ink: #0f2238 (light) · #e3ecf7 (dark) | bg-ink / text-ink · --lause-color-ink | text, filled controls',
```

`packages/tokens/test/build.test.ts:33`:

```ts
    expect(index).toBe("/* generated by @lause-ds/tokens, do not edit */\n@import './tokens.css';\n@import './theme.css';\n");
```

Run: `npx vitest run --project mcp packages/mcp/test/manifest.test.ts && npx vitest run --project '@lause-ds/tokens'`
Expected: both FAIL on the changed strings.

- [ ] **Step 2: Change the emitters**

`packages/mcp/src/manifest.ts`: line 270 `const withDoc = prop.doc ? \`: ${prop.doc}\` : '';`; line 314 `const description = entry.description ? \` | ${entry.description}\` : '';`; line 315 the template's ` <em dash> ${renderUtilities(entry)}` becomes ` | ${renderUtilities(entry)}`; line 354 replace ` <em dash> read them` with `, read them`; line 360 the format sentence becomes ``'Each line is `token: light · dark | Tailwind utility · CSS custom property | what it is for`. The theme is ' +``. Read each of those lines before editing; the exact surrounding text may differ by a character.

`packages/tokens/src/emit-css.ts:47` and `packages/tokens/src/build.ts:30`: `generated by @lause-ds/tokens, do not edit`.

Run: `npm run build:tokens && npm run build:manifest && npx vitest run --project '@lause-ds/tokens' && npx vitest run --project mcp`
Expected: PASS. `git status` shows `llms.txt` and the three CSS files regenerated.

- [ ] **Step 3: Replace the rest by script, then read every changed line**

```bash
node - <<'EOF'
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const DASH = '\u2014';
const files = execSync(`git grep -l "${DASH}" -- . ':!package-lock.json'`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
for (const f of files) {
  const out = readFileSync(f, 'utf8').split('\n').map((line) => {
    if (!line.includes(DASH)) return line;
    const colon = /^\s*#/.test(line) || /\bit\(/.test(line) || new RegExp(`^\\s*- \\*\\*[^*]+\\*\\* ${DASH} `).test(line);
    return line.replaceAll(` ${DASH} `, colon ? ': ' : ', ').replaceAll(DASH, ', ');
  }).join('\n');
  writeFileSync(f, out);
}
console.log(files.length, 'files');
EOF
git diff -U0 | grep '^+' | grep -v '^+++' | grep -nE ' , |,\s*$|^\+\s*(//|\*|/\*|\{/\*)\s*,'
```

The second command lists awkward joins (a comma before a line end, or a comment that now starts with a comma). Fix each by hand so the sentence reads well. Then read the whole diff once, `git diff | less`, and fix any line that reads wrong. Headings keep a colon, prose gets a comma or a full stop.

Run: `git grep -c $'\xe2\x80\x94' -- . ':!package-lock.json'`
Expected: no output.

- [ ] **Step 4: Add the CI gate**

In `.github/workflows/ci.yml`, after the `fail if generated files drifted` step, add:

```yaml
      - name: no em dashes
        run: |
          if git grep -n $'\xe2\x80\x94' -- . ':!package-lock.json'; then
            echo 'Em dashes are not allowed in this repo. Use a comma, a colon, a full stop or brackets.'
            exit 1
          fi
```

- [ ] **Step 5: Run every gate and commit**

Run: `npm run build:tokens && npm run build:manifest && npm run build:mcp && npm run build:ui && npm run typecheck && npm run build:site && npm run check:site && npm test`
Expected: all clean; `git status` shows only the intended files.

Create `.changeset/llms-format.md`:

```md
---
"lause-ds-mcp": patch
---

llms.txt separates the parts of a token line with a vertical bar instead of a dash.
```

```bash
git add -A
git commit -m "style: no em dashes anywhere on main; CI fails on the next one"
```

---

### Task 5: Follow the Netlify rename through the repo

Rock renames the Netlify project (suggested name `lause-ds`, so the URL becomes `https://lause-ds.netlify.app`). This task runs only after Rock confirms the new name. Until then the implementer skips it and the ledger records "waiting for Rock".

**Files:**
- Modify: `README.md:120,138`, `packages/mcp/README.md:25`, `packages/site/src/sections/Install.tsx:16`, `packages/site/vite.config.ts:11`, `docs/specs/2026-09-03-lause-ds-design.md`, `docs/superpowers/plans/2026-09-05-docs-site.md`, `docs/superpowers/plans/2026-09-05-docs-site-design.md`
- Test: `packages/site/test/install.test.tsx` (if it asserts the command text; check with `grep -n netlify packages/site/test/install.test.tsx`)

- [ ] **Step 1: Replace the host everywhere**

```bash
git grep -l 'shiny-frangipane-78fc08.netlify.app' -- . ':!package-lock.json' | xargs sed -i '' 's|shiny-frangipane-78fc08\.netlify\.app|lause-ds.netlify.app|g'
git grep -n 'shiny-frangipane' -- . ':!package-lock.json'
```

Expected after the second command: only Netlify dashboard links (`app.netlify.com/projects/shiny-frangipane-78fc08`) remain, if any; the site id does not change with the name, so leave those.

- [ ] **Step 2: Verify the new host answers**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://lause-ds.netlify.app/
curl -s -X POST https://lause-ds.netlify.app/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}'
```

Expected: `200`, and a JSON result with `"serverInfo":{"name":"lause-ds"`.

- [ ] **Step 3: Run the site tests and commit**

Run: `npm run build:ui && npx vitest run --project site && npm run check:site`
Expected: PASS.

```bash
git add -A
git commit -m "docs: the site and the MCP server live at lause-ds.netlify.app"
```

Also tell Rock: the `lause-ds-mcp` README on npm still shows the old host until the next publish; the changeset from Task 4 covers that.

---

## Self-review

- Spec coverage: the spec has no requirement for these items; they are parked follow-ups from Plans 3, 5 and 6. LICENSE was on the parked list and already exists (commit 8e26167), so it has no task.
- Placeholders: `<new-name>` in Task 5 is a value Rock supplies; the task cannot start before that.
- Type consistency: Task 1 exports `SurfaceState` as a type-only export; nothing later imports it. Task 3's `FALLBACK` mirrors `FIGMA_FALLBACK_NAME` by value, not by import, and both comments say so.
