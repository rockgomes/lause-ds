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

Format: W3C Design Tokens Community Group JSON (`*.tokens.json`). Three tiers:

- **Primitive**: raw values. `color.ice`, `color.navy`, `color.coral`, `font.serif`, `font.sans`, the size ramp.
- **Semantic**: meaning. `color.ground`, `color.ink`, `color.dim`, `color.accent`, `color.surface`, `type.content`, `type.chrome`, `radius.pill`, `shadow.tile`.
- **Component**: only where a component needs its own knob. `tile.padding`, `bubble.tail`.

Starting values, from the Lause decisions:

| Semantic token | Value |
|---|---|
| `color.ground` | `#e4edf3` |
| `color.ink` | `#0f2238` |
| `color.dim` | `color.ink` at 38% |
| `color.accent` | `#ff5a36` |
| `color.surface` | `#ffffff` |
| `font.content` | Young Serif, Georgia, serif |
| `font.chrome` | Instrument Sans, Helvetica Neue, Arial, sans-serif |
| `type.scale` | 13 · 14 · 16 · 20 · 21 · 54 · 58 · 88 · 150 |
| `radius.pill` | 999px |
| `radius.card` | 22px |
| `radius.bubble` | 10px |
| `shadow.tile` | `0 6px 18px rgba(15,34,56,0.10)` |

Build: tokens compile to CSS custom properties, a Tailwind preset, and a Figma variables
import. One script, three outputs.

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
