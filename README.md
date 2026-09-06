# Lause design system

A design system built from one real product, the Estonian citizenship exam trainer
(`rockgomes/estonian-citizenship-test`), and made readable by machines.

It lives in two places and speaks to a third:

| Place | What | Who uses it |
|---|---|---|
| **Code** — this repo | Tokens as W3C token JSON, a React + Tailwind component library, docs | The app, and any developer |
| **Figma** — the Lause library | Variables bound to the same tokens, components with the same names and props, Code Connect | Designers |
| **MCP server** — `packages/mcp` | Serves tokens, components and usage rules to AI tools (Claude Code, Cursor, Figma) | AI agents, and anyone who wants to try it |

The point of the third row: an AI tool asks the system for its parts and builds a correct
screen. That is the demo, and it is what the two other rows exist to feed.

## Decisions so far

Written in full in [docs/specs/2026-09-03-lause-ds-design.md](docs/specs/2026-09-03-lause-ds-design.md).

1. Ship an MCP server, with agent-ready files (token JSON, component manifest, `llms.txt`,
   Code Connect) as its base.
2. First release holds only what the Lause screens need: the tokens and about ten
   components. Generic parts come later, when a screen needs them.
3. One source: `tokens/` feeds the code, the Figma variables and the server.
4. Separate repo, published to npm as `lause-ds`. The app imports it.

## Layout

```
tokens/           W3C design-token JSON — the single source
packages/tokens   the token build tool (private)
packages/ui       lause-ds: React + Tailwind components, one folder per component, stories beside them
packages/mcp      the MCP server; reads tokens/ and packages/ui (Plan 5)
figma/            variables export, Code Connect mappings (Plan 4)
docs/             specs, plans, component rules
```

## Working rules

- Every pull request gets a deploy preview and a CI run. Merging to `main` publishes.
- Nothing merges without a screen in the app that uses it.
- Chrome and copy in the app stay in Estonian. The system's own docs are in English.

## Status

Foundation and ten components done: Keycap, Button, Progress, Bar, Dial, Tile, Bubble, Sentence, Nav, Cell, plus the usePeek hook. Every story is a test with an axe check. Figma library next (Plan 4).

## Using the system

```bash
npm run build:tokens     # regenerates tokens/primitives.tokens.json, packages/ui/src/tokens/*.css, figma/variables.json
npm run build:manifest   # regenerates components.manifest.json and llms.txt; what an AI tool reads first
npm test                 # includes the WCAG contrast check on every semantic pair, both modes
```

Edit only `tokens/src/*.json` and `tokens/semantic.*.tokens.json`. Everything else under `tokens/`, `packages/ui/src/tokens/`, `figma/`, `components.manifest.json` and `llms.txt` is generated and CI fails if it drifts.

### Consuming them

`lause-ds` requires Tailwind v4 in the consuming app. In your Tailwind CSS entry (for example
`app/globals.css`), in this order:

```css
@import 'tailwindcss';
@import 'lause-ds/styles.css';            /* tokens + the theme; must live here, not in a TSX file */
@source '../node_modules/lause-ds/dist';  /* relative to THIS css file; adjust for src/app/globals.css */
```

Then import components normally:

```tsx
import { Button, Dial, Tile, TileStack } from 'lause-ds';
```

The theme replaces Tailwind's default scales (see below). Load Young Serif and Instrument Sans yourself
(Google Fonts, or self-hosted).

### The theme replaces Tailwind's defaults

`lause-ds/styles.css` closes Tailwind's default colour, spacing, type, font, radius, shadow, leading and
tracking scales. `p-4` is 4px from the token scale; `p-11` and `bg-red-500` do not exist. Arbitrary values
(`min-h-[44px]`) still work. Font weights, breakpoints and easings stay open. `text-reading-narrow` and
`text-headline-narrow` size `reading`/`headline` down for viewports below 640px — pair them with the
base role at the `sm` breakpoint, e.g. `text-reading-narrow sm:text-reading`.

## The workshop

```bash
npm run storybook   # every component, every state, light and dark, with the a11y panel
npm test            # runs every story in Chromium: play functions, then axe; a violation fails
npx changeset       # every pull request that changes lause-ds declares its bump here
```

## The MCP server

`packages/mcp` serves the design system to AI tools over the Model Context Protocol: an
agent asks for tokens or a component instead of guessing at them.

Run it locally, stdio:

```bash
npx lause-ds-mcp
claude mcp add lause -- npx lause-ds-mcp
```

Or point a client at the hosted server, a Netlify Function — no install:

```bash
claude mcp add --transport http lause https://shiny-frangipane-78fc08.netlify.app/mcp
```

(That is this Netlify project's current default hostname; it changes if the project is
renamed.)

To run that same function locally — `netlify/functions/mcp.ts` — while developing it,
`netlify-cli` is not a dependency of this repo, so reach for it with `npx`:

```bash
npx netlify-cli@27.4.3 dev
```

Four tools:

| Tool | What it does |
|---|---|
| `list_tokens` | Every semantic token with its resolved value in light and dark mode, its CSS custom property, its Tailwind theme key, and what it is for |
| `list_components` | Every component and hook the design system exports, with its kind and a one-line summary |
| `get_component` | The full record for one named component or hook: props, states, proof screen, Figma reference, usage rules, and its source and story text |
| `check_usage` | Checks a snippet of JSX/TSX/CSS against the Lause rules and returns findings with line numbers and fixes |

The same data also ships as plain files, for a tool that cannot run an MCP client:
`components.manifest.json` (regenerated by `npm run build:manifest`) and `llms.txt`, both at
the repo root and served from the docs site root by `build:site`.
