# lause-ds

Tokens and React components for the Lause design system, drawn from one real product: the
Estonian citizenship exam trainer (`rockgomes/estonian-citizenship-test`). See the
[full repo](https://github.com/rockgomes/lause-ds) for the tokens, Figma library and MCP server
this package is built from.

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

## Components

- `Keycap`: a keyboard hint that inherits its colour from whatever holds it.
- `Button`: a pill button with filled, outline and dim variants, and an optional keycap.
- `Progress`: the segmented bar under a screen: done, current and rest.
- `Bar`: coverage of one domain: one segment per article, retained/covered/unread.
- `Dial`: a segmented control that behaves as a radio group, with arrow-key selection.
- `Tile`: an option or word tile: idle, selected, filled or dimmed.
- `TileStack`: the column that holds option tiles, one per row.
- `Bubble`: a translation bubble above a term: the gloss, a look-up count, and a promotion note.
- `Sentence`: the reading unit: neighbours dimmed, terms as focusable buttons, marks and pins by dial level, English under in kõrvuti.
- `Nav`: context, caps navigation that swaps to English while peeking, and controls; empty items in exam mode.
- `Cell` / `CellGrid`: the 2×2 drill as a table, with row and column headers; shares Tile's idle/selected/filled/dimmed states.
- `usePeek`: the peek gesture: held modifier or a latch, cleared on blur.

## What the app owns

- Pins and the look-up tally: `Sentence` takes them as props (`pinned`, `counts`) and calls
  `onToggle`; it holds none of that state itself.
- The dial level and the latch: `support` and `usePeek`'s `latched` are the app's own state,
  passed in.
- Announcing a peek: `Sentence` announces a newly pinned term's gloss; it announces nothing for
  peeking itself, since the app decides whether the mode change is worth a separate announcement.
- The unofficial-translation note: required alongside the English text (`english: { text, note }`),
  because the app is the one asserting the translation is unofficial.

## Licence: MIT
