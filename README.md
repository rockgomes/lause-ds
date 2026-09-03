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
tokens/         W3C design-token JSON — the single source
packages/ui     React + Tailwind components, one folder per component
packages/mcp    the MCP server; reads tokens/ and packages/ui
figma/          Code Connect mappings and export scripts
docs/           specs, decisions, component rules
```

## Working rules

- Every pull request gets a deploy preview and a CI run. Merging to `main` publishes.
- Nothing merges without a screen in the app that uses it.
- Chrome and copy in the app stay in Estonian. The system's own docs are in English.

## Status

Planning. No code yet. See the spec for open questions.
