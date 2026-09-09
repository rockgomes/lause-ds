# Lause DS, Plan 4: The Figma Library

> **For agentic workers:** this plan is executed in the controller session with the Figma MCP (`figma-generate-library` + `figma-use` skills), one phase per task, with `get_metadata` / `get_screenshot` validation after every mutation and a state ledger committed to the repo. It is not a subagent-driven code plan: a subagent cannot hold the Figma session. Stop after each task and wait for the human partner's go, per their standing rule.

**Goal:** One Figma library file, "Lause", whose variables are imported from `figma/variables.json` (never typed by hand), whose text and effect styles come from the type roles and shadows, whose components carry the same names, props and states as the code, and whose component sets are Code-Connected to `packages/ui/src/<Name>/<Name>.tsx`.

**Architecture:** Figma is a consumer of the token pipeline, like the CSS. Two variable collections mirror the file exactly: `Primitives` (mode `Value`) and `Semantic` (modes `Light`, `Dark`), semantics aliased to primitives by name. Six text styles and three effect styles sit on top. Each component gets its own page; variant axes are the code's union props (`variant`, `state`, `held`, `support`, `peeking`) plus an `Interaction` axis (rest / hover / pressed / focus / disabled) where the code has CSS states; repeated parts (segments, dial positions, nav items, terms) are `.Building Blocks/` sub-components. Everything created is recorded in `figma/library.json`, committed, so the build is resumable and Plan 5's manifest can join Figma ids to code.

**Tech Stack:** Figma MCP (`use_figma`, `get_metadata`, `get_screenshot`, `get_libraries`, `search_design_system`, `add_code_connect_map`, `get_code_connect_map`), Figma Plugin API, Rock's Team (Pro, `team::847873602547393130`), Google Fonts Young Serif + Instrument Sans (available in Figma).

**Spec:** `docs/specs/2026-09-03-lause-ds-design.md`, §5 Figma; §2 decisions 3, 6; §3 tokens; §4 components. Contract of the variables file: `figma/README.md`.

**Roadmap:** Plan 5 MCP server (serves tokens, a component manifest, Code Connect); Plan 6 docs site and public Storybook.

## Global Constraints

- Nothing in Figma is typed by hand that exists in `figma/variables.json`: every variable's name, type, value and alias comes from the file; a mismatch is a bug in the emitter, fixed in `packages/tokens`, never in Figma.
- Component sets are named exactly as the code exports (`Keycap`, `Button`, `Progress`, `Bar`, `Dial`, `Tile`, `Bubble`, `Sentence`, `Nav`, `Cell`); variant property names are the code's prop names in the same casing (`variant`, `state`, `held`, `support`, `peeking`); values are the code's values (`filled`, `outline`, `dim`, `idle`, …). The one added axis is `interaction` = `rest | hover | pressed | focus | disabled`.
- Every visual property on a component is bound to a variable (fills, strokes, text fills, padding, gap, radius, stroke weight, opacity); text uses the six text styles. Raw numbers only for the rule values 44 (target) and 640 / 1020 (measures).
- Scopes on every variable, never `ALL_SCOPES`; primitives hidden (`scopes = []`) except where a rule below says otherwise. Code syntax `WEB` on every variable: `var(--lause-<path with '/'→'-'>)`.
- `use_figma` calls are sequential, one page per call, ids only from the ledger; validate with `get_metadata` after every create and `get_screenshot` after every component.
- Docs in Figma (page notes, component descriptions) in English; sample copy in components Estonian, as in stories.
- Repo commits conventional, each ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; the PR body ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

---

## Phase 0: Discovery (done while writing this plan)

**0a Code.** Tokens: `figma/variables.json`: Primitives 84 variables (35 COLOR, 45 FLOAT, 4 STRING), Semantic 44 (13 COLOR, 22 FLOAT, 9 STRING) with `{ alias }` values in both modes. Shadows: `shadow/low` `0 1px 3px`, `shadow/mid` `0 6px 18px`, both `rgba(15,34,56,.10)`; semantic `shadow/tile` → `shadow/mid`. Type roles: label 13/17/600 sans, body 16/24/400 sans, title 19/25/600 sans, reading 57/105/400 serif, headline 83/91/400 serif, display 143/157/400 serif (lineHeight px from `type/<role>/lineHeight`). Components: the ten exports of `packages/ui/src/index.ts` plus `TileStack`, `CellGrid`, the `usePeek` hook (no Figma counterpart).

**0b Figma.** No file yet. Rock's Team, Pro tier (4 modes allowed; we need 2). No existing conventions to match.

**0c Libraries.** Run `get_libraries` and `search_design_system` on the new file before Phase 3; expected empty. Nothing to reuse: the system is its own source.

**0d Scope lock.** Variables: all 128. Styles: 6 text, 3 effect. Components: the ten plus four building blocks (below). Not built: `usePeek` (behaviour), `TileStack` and `CellGrid` as layouts (they become frames inside the Tile and Cell pages, not components).

**0e Code → Figma decisions.**

| Question | Decision | Why |
|---|---|---|
| `type/leading/*` and `type/tracking/*` are ratios | Imported as hidden FLOAT variables (`scopes = []`), documented; text styles use the px `type/<role>/lineHeight` and a computed letter-spacing percent | Figma binds px, not ratios (figma/README.md) |
| `shadow/*` are strings | Imported as hidden STRING variables for traceability; the drawn shadows are effect styles parsed from the same string | No per-field shadow variable exists |
| `type/<role>/fontFamily` is an alias to a stack string | STRING variable; the text style's family is the first name of the stack (`Young Serif`, `Instrument Sans`) | Figma wants one family |
| Font weight 600 for Instrument Sans | Text style `fontName.style` = `SemiBold` or `Semi Bold`, whichever `listAvailableFontsAsync` reports | Style names vary per font |
| Interaction states (hover/pressed/focus/disabled) | An `interaction` variant axis; hover/pressed fills bound to the hover/active tokens; focus draws a 2px accent stroke outside (`stroke/focus`, offset 2); disabled binds `opacity/dim` | Mirrors the CSS |

**0f Gap analysis.** Code → Figma: everything (new file). Figma → code: nothing. Conflicts: none.

---

## File structure (repo side)

```
figma/library.json        the state ledger: file key, page ids, collection/mode ids, variable ids by name, style ids, component set ids, Code Connect status (committed after each phase)
figma/README.md           + a "Library" section: file link, how the ledger is used, what to re-run after a token change
docs/superpowers/plans/2026-09-04-figma-library.md   this plan
```

The ledger shape:
```json
{
  "fileKey": "…", "fileUrl": "…", "planKey": "team::847873602547393130",
  "phase": "phase1", "completedSteps": [],
  "collections": { "Primitives": { "id": "…", "modes": { "Value": "…" } }, "Semantic": { "id": "…", "modes": { "Light": "…", "Dark": "…" } } },
  "variables": { "color/navy/900": "VariableID:…" },
  "styles": { "text": { "Label": "S:…" }, "effect": { "shadow/mid": "S:…" } },
  "pages": { "Cover": "0:1" },
  "components": { "Button": { "setId": "…", "variants": 15, "codeConnect": false } }
}
```

---

### Task 1: The file and the ledger

- [ ] **Step 1: Create the file.** Load `figma-create-new-file`; `create_new_file({ fileName: 'Lause', planKey: 'team::847873602547393130', editorType: 'design' })`. Record `fileKey` and URL.
- [ ] **Step 2: Discovery on the new file.** `get_libraries(fileKey)`; `search_design_system({ query: 'button', fileKey })` (expected empty; record the result). Read-only `use_figma`: list pages (one page "Page 1").
- [ ] **Step 3: Fonts.** Read-only `use_figma`: `listAvailableFontsAsync()` filtered to `Young Serif` and `Instrument Sans`; record the exact style strings for Regular and the 600 weight. If either family is missing, stop and report (Rock installs or picks a fallback).
- [ ] **Step 4: Ledger.** Write `figma/library.json` with `fileKey`, `fileUrl`, `planKey`, fonts, `phase: "phase0"`. Commit: `feat(figma): the Lause library file and its ledger`.
- [ ] **Exit:** file exists, fonts confirmed, ledger committed. Post the Task 1 summary and stop.

### Task 2: Variables (Phase 1a–1e)

- [ ] **Step 1: Collections.** One `use_figma`: create `Primitives` (rename mode to `Value`) and `Semantic` (rename to `Light`, `addMode('Dark')`). Idempotent by name. Return ids; ledger them.
- [ ] **Step 2: Primitives.** Read `figma/variables.json` in the controller; embed the `Primitives` variables array in one `use_figma` (it is ~84 entries; split into two calls if the code exceeds 40 KB). For each: `createVariable(name, coll, type)`, `setValueForMode(valueMode, …)` (COLOR via `hexToRgb`, FLOAT as is, STRING as is), then scopes and code syntax by these rules:

| Name pattern | Scopes | Code syntax |
|---|---|---|
| `color/*` | `[]` (hidden) | `var(--lause-color-<hue>-<step>)`, `var(--lause-color-white)` |
| `type/size/*` | `['FONT_SIZE']` | `var(--lause-type-size-<n>)` |
| `type/leading/*`, `type/tracking/*` | `[]` (ratios, documented) | `var(--lause-type-leading-<name>)`, `var(--lause-type-tracking-<name>)` |
| `space/*` | `['GAP', 'WIDTH_HEIGHT']` | `var(--lause-space-<n>)` |
| `radius/*` | `['CORNER_RADIUS']` | `var(--lause-radius-<name>)` |
| `stroke/*` | `['STROKE_FLOAT']` | `var(--lause-stroke-<name>)` |
| `shadow/*` | `[]` (string, documentation) | `var(--lause-shadow-<name>)` |
| `font/family/*` | `['FONT_FAMILY']` | `var(--lause-font-family-<name>)` |
| `opacity/*` | `['OPACITY']` | `var(--lause-opacity-<name>)` |

  Return `{ name → id }`; ledger all of them.
- [ ] **Step 3: Semantic.** One `use_figma` with the `Semantic` array embedded. Each variable: type as in the file; for every mode, `{ alias }` → `createVariableAlias(primitiveByName[alias])` (throw on a missing name: that is an emitter bug); literal numbers (`type/<role>/fontWeight`, `type/<role>/lineHeight`) set as FLOAT. Scopes:

| Name | Scopes |
|---|---|
| `color/ground`, `color/surface`, `color/ground-hover`, `color/surface-hover` | `['FRAME_FILL', 'SHAPE_FILL']` |
| `color/ink`, `color/ink-hover`, `color/ink-active` | `['ALL_FILLS', 'STROKE_COLOR']` |
| `color/dim`, `color/on-ink`, `color/accent-text`, `color/accent-text-on-ink` | `['TEXT_FILL']` |
| `color/accent`, `color/accent-on-ink` | `['SHAPE_FILL', 'STROKE_COLOR', 'FRAME_FILL']` |
| `font/content`, `font/chrome`, `type/*/fontFamily` | `['FONT_FAMILY']` |
| `type/*/fontSize` | `['FONT_SIZE']` · `type/*/lineHeight` `['LINE_HEIGHT']` · `type/*/fontWeight` `['FONT_WEIGHT']` |
| `radius/control`, `radius/card`, `radius/bubble`, `radius/keycap` | `['CORNER_RADIUS']` |
| `shadow/tile` | `[]` |

  Code syntax `var(--lause-<path>)` (e.g. `var(--lause-color-ink)`, `var(--lause-type-body-size)` for `type/body/fontSize`; note the CSS name is `-size`/`-leading`/`-weight`/`-font`, read the mapping from `packages/ui/src/tokens/tokens.css`).
- [ ] **Step 4: Validate.** The token-creation reference's three validation scripts: counts (2 collections, 84 + 44), broken aliases = 0, no `ALL_SCOPES`, no missing code syntax. Ledger `phase: "phase1-vars"`, commit `feat(figma): import the variables`.
- [ ] **Exit:** 128 variables, 0 broken aliases. Post the variable summary and stop.

### Task 3: Styles (Phase 1f)

- [ ] **Step 1: Effect styles.** Parse the three shadow strings from the ledger's variable values: `shadow/low`, `shadow/mid`, `shadow/tile` (= mid). Create effect styles named `shadow/low`, `shadow/mid`, `shadow/tile` with `DROP_SHADOW` `{ offset: {0, y}, radius: blur, spread: 0, color: rgba(15,34,56,0.10) }`.
- [ ] **Step 2: Text styles.** Six styles named `Label`, `Body`, `Title`, `Reading`, `Headline`, `Display`. Load the fonts from the ledger's exact style strings. Set `fontName`, then bind: `setBoundVariable('fontSize', type/<role>/fontSize)`, `setBoundVariable('lineHeight', type/<role>/lineHeight)`, `setBoundVariable('fontFamily', type/<role>/fontFamily)` where the API allows; letter-spacing `0` except `Label` gets `{ value: 10, unit: 'PERCENT' }` (caps tracking 0.1em). Document that Figma text styles cannot bind a ratio. Description on each style: the role's purpose from the spec.
- [ ] **Step 3: Validate** with the style-count script; screenshot none yet. Ledger, commit `feat(figma): text and effect styles`.
- [ ] **Exit:** 6 text + 3 effect styles. Stop.

### Task 4: Pages and foundations (Phase 2)

- [ ] **Step 1: Pages** in this order: `Cover`, `Foundations · Colour`, `Foundations · Type`, `Foundations · Space`, `---`, `Keycap`, `Button`, `Progress`, `Bar`, `Dial`, `Tile`, `Bubble`, `Sentence`, `Nav`, `Cell`, `---`, `.Building Blocks`. Rename "Page 1" to `Cover`.
- [ ] **Step 2: Cover.** A 1440×900 frame: `Lause` in Display, one line in Body ("A design system from one product: the Estonian citizenship exam trainer"), the repo URL, the date. Fills bound to `color/ground` / `color/ink`.
- [ ] **Step 3: Foundations · Colour.** Swatch rows per hue (11 steps) bound to primitives; a second block of the 13 semantic colours, each swatch bound to the semantic variable, shown twice: one frame in Light mode, one with `setExplicitVariableModeForCollection(Semantic, Dark)`.
- [ ] **Step 4: Foundations · Type.** One line per role in its text style ("Igaühel on õigus vabalt liikuda"), with the role name in Label.
- [ ] **Step 5: Foundations · Space.** Bars for `space/*` widths bound to variables; radius and stroke samples.
- [ ] **Step 6: Validate** with `get_screenshot` on each foundations page; ledger page ids; commit `feat(figma): pages and foundations`.
- [ ] **Exit:** pages exist, screenshots look right. Stop.

### Task 5: Building blocks (Phase 3, tier 0)

Each on the `.Building Blocks` page, each its own component set, each validated with `get_metadata` + `get_screenshot` before the next.

| Set | Axes | Count | Bindings |
|---|---|---|---|
| `.Building Blocks/Segment` | `state` = done · current · rest | 3 | fill ink / accent / ink + `opacity/faint`; height `space/4`; radius `radius/control` |
| `.Building Blocks/Bar segment` | `segment` = retained · covered · unread | 3 | as above, height `space/8` |
| `.Building Blocks/Dial segment` | `selected` = true · false × `interaction` = rest · hover · pressed · focus | 8 | Label style; selected fill ink / text on-ink; unselected text dim; hover ground-hover; pressed text ink; focus stroke accent `stroke/focus` |
| `.Building Blocks/Nav item` | `current` = true · false × `peeking` = true · false | 4 | Label style, uppercase, letter-spacing 10 %; current ink, other dim; TEXT `label`, TEXT `labelEn` |
| `.Building Blocks/Term` | `marked` = true · false × `state` = idle · pinned × `peeked` = true · false | 8 | Reading style; underline dotted/solid accent (`stroke/mark` / `stroke/pin`) drawn as a rectangle under the text bound to the stroke tokens; TEXT `text` |

- [ ] Ledger every set id; commit `feat(figma): building blocks`. Stop.

### Task 6: Components, tier 1 (Phase 3)

One page each; per component: doc frame (name, one-paragraph description from the code's JSDoc, the proof screen), base component with full bindings, variants, `combineAsVariants`, grid (interaction on columns), properties, description + `documentationLinks` (Storybook URL placeholder until Plan 6), `get_metadata`, `get_screenshot`, ledger, commit.

| Set | Axes | Count | Properties |
|---|---|---|---|
| `Keycap` | `held` = false · true | 2 | TEXT `key` ("↵") |
| `Button` | `variant` = filled · outline · dim × `interaction` = rest · hover · pressed · focus · disabled | 15 | TEXT `label` ("Edasi"), BOOLEAN `keycap` (shows a nested `Keycap` instance), INSTANCE_SWAP not needed |
| `Progress` | none (one component: 8 `Segment` instances, done×4, current, rest×3) | 1 | none; designers change segment states on instances |
| `Bar` | none (one component: 10 `Bar segment` instances) | 1 | none |
| `Dial` | `positions` = 2 · 3 × `disabled` = false · true | 4 | none; segments are `Dial segment` instances (first selected) |
| `Tile` | `state` = idle · selected · filled · dimmed × `interaction` = rest · hover · pressed · focus | 16 | TEXT `label` ("Riigikogu"), BOOLEAN `keycap` |
| `Bubble` | none | 1 | TEXT `gloss`, BOOLEAN `count`, TEXT `count` ("×1"), BOOLEAN `note`, TEXT `note` |

Stop after Keycap + Button (post screenshots), and again after the rest of tier 1.

### Task 7: Components, tier 2 (Phase 3)

| Set | Axes | Count | Properties |
|---|---|---|---|
| `Sentence` | `support` = et · tugi · korvuti × `peeking` = false · true | 6 | TEXT `previous`, `next`, `english`, `englishNote`; body is a fixed sample of `Term` instances (three terms, one pinned) |
| `Nav` | `mode` = reader · exam × `peeking` = false · true (exam+true omitted) | 3 | TEXT `context`; nested `Nav item` instances ×4; controls slot as INSTANCE_SWAP defaulting to a nested `Dial` instance |
| `Cell` | `state` = idle · selected · filled · dimmed × `interaction` = rest · hover · pressed · focus | 16 | TEXT `subject`, TEXT `verdict`, TEXT `key` |

Plus two layout frames (not components) on their pages: `TileStack` (four `Tile` instances, 640 wide, gap `space/12`) on the Tile page and `CellGrid` (headers + four `Cell` instances) on the Cell page.

Stop after each component's screenshot.

### Task 8: Publish, Code Connect, QA (Phase 4)

- [ ] **Step 1 (Rock):** publish the file as a team library from the Figma UI (Assets → Library → Publish). The MCP cannot publish. I stop and ask.
- [ ] **Step 2: Code Connect.** For each of the ten sets: `add_code_connect_map({ nodeId: setId, fileKey, source: 'packages/ui/src/<Name>/<Name>.tsx', componentName: '<Name>', label: 'React' })`, then `get_code_connect_map` to verify. Ledger `codeConnect: true` per set.
- [ ] **Step 3: Audits** via read-only `use_figma`: unresolved bindings (any SOLID fill/stroke without `boundVariables` on component pages), unnamed nodes (`Component N`, `Frame N`), duplicate names, `ALL_SCOPES`. Fix what the audit finds, one call per page.
- [ ] **Step 4: Screenshots** of every page; post them.
- [ ] **Step 5: Docs.** `figma/README.md` gains `## Library`: the file URL, what `library.json` holds, and "after a token change: `npm run build:tokens`, then re-run the Task 2 import script: it is idempotent by name and updates values". Spec §5 gains one line: the library file link. Changeset none (no package change). Commit `docs(figma): the library and its ledger`; open PR `feat: the Lause Figma library` with the file URL in the body.
- [ ] **Exit:** ten Code Connect mappings verified, audits clean, PR open. Stop.

---

## What only Rock can do

1. Publish the file as a library (Task 8 step 1): a Figma UI action.
2. Confirm the file lives where he wants it (drafts vs a project): Task 1 creates it in his drafts; he can move it.
3. Approve each screenshot checkpoint.

## Self-review

**Spec coverage.** §5: one library file "Lause" (T1); variables imported from `tokens/` never typed (T2, from the generated file); components and props named as in code (T5–T7 tables); Code Connect per component (T8); built through the Figma MCP then finished by hand (T8 hands over). Decision 3 single source (T2 reads the emitted file; README says re-run after a token change). Decision 6 dark mode (Semantic Dark mode, Foundations · Colour shows both).

**Placeholders.** None: every table carries names, axes, counts and bindings; scope rules are exhaustive over the 128 names (color, type/size, type/leading, type/tracking, space, radius, stroke, shadow, font/family, opacity, and the semantic groups).

**Consistency.** Component set names = `index.ts` exports; prop names/values = the code's (`variant` filled/outline/dim; `state` idle/selected/filled/dimmed; `held`; `support` et/tugi/korvuti; `peeking`; Cell `subject`/`verdict`; Bar `segment` retained/covered/unread; Progress segment `state` done/current/rest; Dial `selected`; Nav item `current`); the added `interaction` axis is the only non-code name and is declared in Global Constraints.
