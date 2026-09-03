# Lause design system — design

**Date:** 2026-09-03
**Status:** Draft. Open questions at the end are being settled one at a time.
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
| 6 | Light theme only in the first release, but tokens are structured so a mode can be added | The product decision was light-only; the token structure should not close the door |

## 3. Tokens

Format: W3C Design Tokens Community Group JSON (`*.tokens.json`). Three tiers.

**Primitives are full ramps built by a rule.** They are the generic part of the system and
they are complete from day one, even where no screen uses a step yet. The "only what Lause
needs" rule applies to components, never to primitives.

| Ramp | Rule | Steps |
|---|---|---|
| `color.*` | One ramp per hue, 11 steps `50`–`950`, generated in OKLCH from a brand anchor so lightness is even across hues | `navy` (anchor `#0f2238`), `ice` (blue-grey neutrals, anchor `#e4edf3`), `coral` (anchor `#ff5a36`); plus `white`, `black` |
| `type.size` | Modular scale, base 16px, ratio 1.2 (minor third), rounded to whole px | 11 · 13 · 16 · 19 · 23 · 28 · 33 · 40 · 48 · 57 · 69 · 83 · 99 · 119 · 143 |
| `type.leading` | Named line heights | `tight` 1.1 · `snug` 1.3 · `normal` 1.5 · `open` 1.85 |
| `space` | 4px base | 0 · 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192 |
| `radius` | Named | `none` 0 · `sm` 4 · `md` 10 · `lg` 22 · `pill` 999 |
| `shadow` | Two levels, tinted with `navy` | `low` `0 1px 3px` · `mid` `0 6px 18px` at 10% |
| `font.family` | Two stacks | `serif` Young Serif, Georgia · `sans` Instrument Sans, Helvetica Neue, Arial |
| `opacity` | Named | `dim` 38% · `faint` 18% |

**Semantic tokens give meaning.** They point at a ramp step, never at a raw value. This
is the tier a mode (dark, a second brand) swaps.

| Semantic | Points at | Note |
|---|---|---|
| `color.ground` | `ice.100` | page background |
| `color.ink` | `navy.900` | text, filled controls |
| `color.dim` | `navy.500` | secondary text; a solid step, so contrast is checkable. An alpha twin `color.dim-alpha` (`ink` at `opacity.dim`) exists for layering over images |
| `color.accent` | `coral.500` | the one accent |
| `color.surface` | `white` | tiles |
| `font.content` | `font.family.serif` | the thing being learned |
| `font.chrome` | `font.family.sans` | everything else |
| `type.label` · `type.chrome` · `type.body` · `type.tile` · `type.reading` · `type.stem` · `type.headword` · `type.score` | `type.size` steps 13 · 13 · 16 · 19 · 57 · 57 · 83 · 143 | The mockups used 14, 20, 21, 54, 58, 88, 150; they are re-fitted to the ramp when built |

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

One library file, "Lause". Variables imported from `tokens/`, never typed by hand.
Components named exactly as in code, props named as in code. Code Connect maps each
Figma component to its React file. Built through the Figma MCP from the token and
component definitions, then finished by hand.

## 6. MCP server

`packages/mcp`, TypeScript, runs locally first (`npx lause-ds-mcp`), then on a URL for the
portfolio. Tools, first cut:

| Tool | Returns |
|---|---|
| `list_tokens` | The semantic tokens with values and intent |
| `get_component(name)` | Props, states, the React source, the usage rules, the proof screen |
| `list_components` | Names and one-line purposes |
| `check_usage(code)` | Rule breaks: raw hex, wrong font, a tile in a row, a stem without the type scale |

Agent-ready files that ship regardless of the server: `tokens/*.tokens.json`,
`components.manifest.json`, `llms.txt`, Code Connect.

## 7. Working rules

- Branch, pull request, deploy preview, CI on every push. Merge to `main` publishes the
  package and the docs.
- A component merges only with its proof screen in the app.
- Docs in English. App chrome stays in Estonian.

## 8. Open questions, in the order to settle them

1. Theming: light only, or add one mode (dark or a second brand) to show the structure works.
2. Docs site: Storybook, or a small custom site in the system's own style.
3. Versioning and release: changesets, semver, when the app pins a version.
4. Where the MCP server is hosted for the public demo.
5. Accessibility bar: WCAG AA for every component, checked in CI.
