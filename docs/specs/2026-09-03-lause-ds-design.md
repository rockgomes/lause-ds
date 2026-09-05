# Lause design system — design

**Date:** 2026-09-03
**Status:** Settled. Ready for an implementation plan.
**Origin:** The UI direction "Lause" of the Estonian citizenship exam trainer. Visual rules
live in that repo at `docs/design/2026-09-03-lause-design-decisions.md`; this system is the
reusable form of them.

## 1. Purpose

Two audiences, one artefact.

1. **The app.** The exam trainer imports this system. Every token and component here has a
   screen there that uses it. The app is the proof.
2. **Hiring.** A working example of what a design system designer ships in 2026: tokens as
   data, a Figma library bound to them, a coded library, and an MCP server so AI tools build
   UI that follows the system. The demo is "an AI builds a correct screen from my system".

## 2. Decisions

| # | Decision | Why |
|---|---|---|
| 1 | Ship an MCP server, with agent-ready files as its base | The server is the differentiator; the files make it honest and useful without it |
| 2 | First release: tokens plus only the components the Lause screens need | Every part has a real use; no speculative kit |
| 3 | `tokens/` is the single source; code, Figma and the server all read it | One change, three places updated |
| 4 | Separate repo, npm package `lause-ds`, the app imports it | A system with a customer, not a folder inside an app |
| 5 | React + Tailwind for the coded library | Matches the app's stack (Next.js, Tailwind, shadcn) |
| 6 | One dark mode ships in the first release | Proves the semantic layer swaps cleanly; the first thing a system interviewer asks about. The app itself stays light |
| 7 | Two docs surfaces: a custom site as the front door, built with the system's own components, and a public Storybook as the workshop | The site tells the story and shows one example per component; Storybook shows every state. Each links to the other and never copies the other's job. The site is built last, after components exist |
| 8 | Changesets plus semver; merging to `main` bumps and publishes to npm; the app pins a version | One sentence per pull request buys a trustworthy changelog, and nothing changes when a second consumer arrives |
| 9 | The MCP server runs on Netlify Functions, in the same repo and deploy as the docs site | One host, one pipeline, a preview per pull request; fits the git-connected, CI-on-every-push rule |
| 10 | WCAG AA on every component, checked in CI: a script tests every token contrast pair, every Storybook story runs an axe check, a failing check fails the pull request | Contrast is a gate, not an afterthought; a visible failing check is the proof |

## 3. Tokens

Format: W3C Design Tokens Community Group JSON (`*.tokens.json`). Three tiers.

**Primitives are full ramps built by a rule.** They are the generic part of the system and
they are complete from day one, even where no screen uses a step yet. The "only what Lause
needs" rule applies to components, never to primitives.

| Ramp | Rule | Steps |
|---|---|---|
| `color.*` | One ramp per hue, 11 steps `50`–`950`, generated in OKLCH from a brand anchor so lightness is even across hues; the anchor itself is kept exact at its home step (navy.900, coral.500), so lightness at those steps follows the brand, not the grid | `navy` (anchor `#0f2238`), `coral` (anchor `#ff5a36`); plus `white`, `black` |
| `type.size` | Modular scale, base 16px, ratio 1.2 (minor third), rounded to whole px, then tuned by eye where a step reads wrong; every tuning is noted next to the value | 11 · 13 · 16 · 19 · 23 · 28 · 33 · 40 · 48 · 57 · 69 · 83 · 99 · 119 · 143 |
| `type.leading` | Named line heights | `tight` 1.1 · `snug` 1.3 · `normal` 1.5 · `open` 1.85 |
| `type.tracking` | Named letter-spacing | `caps` 0.1em |
| `space` | 4px base | 0 · 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192 |
| `radius` | Named | `none` 0 · `sm` 4 · `md` 10 · `lg` 22 · `pill` 999 |
| `stroke` | Named widths | `thin` 1.5 · `focus` 2 · `mark` 3 · `pin` 4 |
| `shadow` | Two levels, tinted with navy.900 at 10%, derived from the anchor | `low` `0 1px 3px` · `mid` `0 6px 18px` at 10% |
| `font.family` | Two stacks | `serif` Young Serif, Georgia · `sans` Instrument Sans, Helvetica Neue, Arial |
| `opacity` | Named | `dim` 38% · `faint` 18% |

The blue-grey neutrals were a second ramp (`ice`, anchored at `#e4edf3`) until 2026-09-04; it was merged into `navy` because the two were indistinguishable step for step.

**Semantic tokens give meaning.** They point at a ramp step, never at a raw value. This
is the tier a mode (dark, a second brand) swaps.

| Semantic | Light | Dark | Note |
|---|---|---|---|
| `color.ground` | `navy.100` | `navy.950` | page background |
| `color.ink` | `navy.900` | `navy.100` | text, filled controls |
| `color.dim` | `navy.700` | `navy.400` | secondary text; a solid step, so contrast is checkable. Tuned from `navy.500`: 500 and 600 fail 4.5:1 on `ground`; 700 measures 5.44:1 (light), `navy.400` 8.43:1 (dark) |
| `color.accent` | `coral.600` | `coral.500` | graphic accent (underlines, current segment, lit edge). Tuned from `coral.500` on light: the anchor is 2.62:1 on `navy.100`, below the 3:1 graphic minimum; 600 measures 3.98:1. Dark keeps the anchor at full strength, 5.82:1 on `navy.950` |
| `color.accent-text` | `coral.700` | `coral.300` | accent used as small text; 6.02:1 (light), 10.34:1 (dark) |
| `color.accent-on-ink` | `coral.500` | `coral.600` | accent drawn on `ink` fills. One `accent` cannot pass on both `ground` and `ink` in both modes because ink and ground swap luminance; 5.18:1 (light), 3.98:1 (dark) |
| `color.accent-text-on-ink` | `coral.500` | `coral.700` | accent as small text on `ink` fills (the bubble's count); 5.18:1 (light), 6.02:1 (dark) |
| `color.on-ink` | `navy.100` | `navy.950` | text on ink fills; 13.48:1 (light), 15.13:1 (dark) |
| `color.ink-hover` | `navy.800` | `navy.200` | hover on ink fills; pressed is `color.ink-active` (`navy.950` / `navy.300`) |
| `color.ink-active` | `navy.950` | `navy.300` | pressed on ink fills |
| `color.ground-hover` | `navy.200` | `navy.900` | hover fill on outline and dim buttons and dial segments; pressed keeps the fill and turns the text to `ink` |
| `color.surface-hover` | `navy.50` | `navy.800` | hover fill on tiles; pressed drops the shadow |
| `color.surface` | `white` | `navy.900` | tiles |
| `font.content` | `font.family.serif` | same | the thing being learned |
| `font.chrome` | `font.family.sans` | same | everything else |
| Type roles, the only names anyone uses: `type.label` · `type.body` · `type.title` · `type.reading` · `type.headline` · `type.display` | `type.size` steps 13 · 16 · 19 · 57 · 83 · 143, each with a `font`, `leading` and `weight` | same | Roles follow the shape people know from Material and Apple (display, headline, title, body, label), plus `reading` because Lause's unit is a sentence. The mockups used 14, 20, 21, 54, 58, 88, 150; they are re-fitted to the roles when built. Nobody references a step number directly |

**Component tokens** exist only where a component needs its own knob (`bubble.tail`,
`tile.stack-gap`). They point at semantic or primitive tokens.

Build: tokens compile to CSS custom properties, a Tailwind preset, and a Figma variables
import. One script, three outputs. The colour ramps are generated, not typed, so changing an
anchor regenerates the ramp.

## 4. Components, first release

Taken from the Lause screens. Each row names the screen that proves it.

| Component | What it is | Proof screen |
|---|---|---|
| `Sentence` | The reading unit: one sentence in `font.content`, previous/next dimmed, marks and pins | Lugeja |
| `Bubble` | Translation bubble above a word; tail; count | Lugeja, ⌥ held |
| `Dial` | Three-position segmented control (Eesti keeles / Tugi / Kõrvuti; Uuri / Koosta) | Lugeja, Skeemid |
| `Keycap` | Keyboard hint (`←` `→` `↵` `1`–`4` `⌥`) with a held state | Everywhere |
| `Button` | Pill; filled `ink`, outline, dim | Everywhere |
| `Tile` | Option or word tile; selected, filled, dimmed states; stacks vertically | Eksam, Kordamine, Koosta |
| `Progress` | Segmented bar: done / current / rest | Everywhere |
| `Bar` | One segment per article; retained / covered / unread | Täna, tulemus |
| `Cell` | 2×2 drill cell | Õigused |
| `Nav` | Top chrome: context left, caps nav centre, controls right; swaps to English on peek | Everywhere |

Not in the first release: Input, Select, Modal, Toast, Table. They arrive with the screen
that needs them.

## 5. Figma

The library file: https://www.figma.com/design/Fi9CrQ0KzJdpCuwNcWbZKF (built by Plan 4; ledger in `figma/library.json`).

One library file, "Lause". Variables imported from `tokens/`, never typed by hand.
Components named exactly as in code, props named as in code. Code Connect maps each
Figma component to its React file. Built through the Figma MCP from the token and
component definitions, then finished by hand.

## 6. MCP server

`packages/mcp`, TypeScript, runs locally first (`npx lause-ds-mcp`), then on a URL for the
portfolio: `https://shiny-frangipane-78fc08.netlify.app/mcp`, a Netlify Function (the URL
changes if the Netlify project is renamed). Tools, first cut:

| Tool | Returns |
|---|---|
| `list_tokens` | The semantic tokens with values and intent |
| `get_component(name)` | Props, states, the React source, the usage rules, the proof screen |
| `list_components` | Names and one-line purposes |
| `check_usage(code)` | Rule breaks: raw hex, wrong font, a tile in a row, a stem without the type scale |

Agent-ready files that ship regardless of the server: `tokens/*.tokens.json`,
`components.manifest.json`, `llms.txt`. Code Connect is not available on this library's
Figma plan; `get_component` returns the same reference another way — `figma: { setId |
componentId, file }`, read from the ledger at `figma/library.json` instead of generated by
Code Connect.

## 7. Working rules

- Branch, pull request, deploy preview, CI on every push. Merge to `main` publishes the
  package and the docs.
- A component merges only with its proof screen in the app.
- Docs in English. App chrome stays in Estonian.

## 8. Open questions

None. All ten decisions are in §2. The next document is the implementation plan.
