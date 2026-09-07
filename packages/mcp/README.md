# lause-ds-mcp

The [Lause design system](https://github.com/rockgomes/lause-ds) — tokens, components, and
usage rules — served over the Model Context Protocol, so an AI tool can look up the design
system instead of guessing at it.

## Install and run

Stdio, no persistent install:

```bash
npx lause-ds-mcp
```

Add it to Claude Code:

```bash
claude mcp add lause -- npx lause-ds-mcp
```

Or skip the install and point a client at the hosted server instead — a Netlify Function,
no local process:

```bash
claude mcp add --transport http lause https://lause-ds.netlify.app/mcp
```

(That URL is the current hostname of the Netlify project this server is deployed to; it
changes if the project is renamed.)

This package bundles the data it needs (`dist/data/bundle.json`, built from the tokens and
component sources at publish time), so it runs correctly installed standalone, outside the
`lause-ds` monorepo it is built from.

## Tools

| Tool | What it does |
|---|---|
| `list_tokens` | Every semantic token with its resolved value in light and dark mode, its CSS custom property, its Tailwind theme key, and what it is for |
| `list_components` | Every component and hook the design system exports, with its kind and a one-line summary |
| `get_component` | The full record for one named component or hook: props, states, proof screen, Figma reference, usage rules, and its source and story text |
| `check_usage` | Checks a snippet of JSX/TSX/CSS against the Lause rules and returns findings with line numbers and fixes |

## License

MIT
