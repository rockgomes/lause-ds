# Docs site: design frames for review

Figma file **Lause · Site**: https://www.figma.com/design/FTC4XMc13ylTR72j1i2FLn (Rock's Team, drafts; move it into the library's project if you like). It consumes the published Lause library by key and never edits the library file.

Page `Site` (`0:1`). Frames: **Desktop 1440** `1:501` (9108 px tall), **Phone 390** `17:260` (2834 px tall).

## Sections on the desktop frame

| # | Section | Node | What it shows | Copy |
|---|---|---|---|---|
| 1 | Nav | `1:502` | Nav instance, mode=reader: context `Lause`, items **Tokens · Components · Reader · Ask**, the dial as the **Light / Dark** switch, `⌥ peek` hint | none |
| 2 | Hero | `1:503` | The sentence in Headline (83 px) as wrapping words; three terms underlined with `stroke/mark` in accent and a Bubble over each (`to stand as a candidate`, `with the right to vote`, `citizen`); the promise; two Buttons | `Riigikogusse võib kandideerida iga vähemalt kahekümne ühe aastane hääleõiguslik Eesti kodanik.`, `One sentence at a time. A design system for a citizenship-exam trainer: tokens as data, a Figma library bound to them, a coded library, and an MCP server so AI tools build screens that follow it.`, Buttons `Ask the system` (filled, keycap K), `Storybook` (outline) |
| 3 | Tokens | `1:504` | 13 colour swatches bound to the semantic variables (light), the same row inside a card with the Semantic collection's **Dark** mode applied, the six-role type specimen with each role's numbers, the four radii and `shadow/tile` | `Swap the Dial in the top-right; every value on this page comes from the same token files.` |
| 4 | Components | `1:505` | 13 cards in manifest order (Keycap, Button, Progress, Bar, Dial, Tile, TileStack, Bubble, Sentence, usePeek, Nav, Cell, CellGrid): live instance on a ground panel, name, manifest summary, `Proof: …`, links `Storybook ↗ · Figma ↗ · Source ↗`. Sentence, Nav and CellGrid cards are full width; the rest sit two per row | summaries verbatim from `components.manifest.json` |
| 5 | Reader | `1:506` | Sentence instance (support tugi, one bubble), the support Dial `Eesti · Tugi · Kõrvuti`, keycap legend `⌥ peek · ↵ pin · esc clear`, Progress `Lause 5 / 8` | `The reading unit, live. Click a term to pin its gloss; hold ⌥ to see every gloss at once; the dial sets how much support the sentence carries.` |
| 6 | Ask | `1:507` | Surface panel: question Dial `Tokens · Component · Check`, the input with `<div className="bg-red-500 text-sm">Tere</div>`, Button `Ask ↵` + `check_usage · POST /mcp`, result card `2 findings` (off-theme-utility, stem-without-role) with a `▸ Raw JSON-RPC response` toggle, and the error line sample | `The same MCP server Claude Code talks to, from this page. Pick a question, send it, read the answer.` |
| 7 | Install | `1:508` | Card with three commands, each with a `Copy` outline Button; the link row; the footer line | `npm install lause-ds` · `claude mcp add --transport http lause https://lause-ds.netlify.app/mcp` · `npx lause-ds-mcp`, `Built with the components it documents. Every value on this page is read from the token files at build time.` |
| 8 | Footer | `1:509` | Progress instance spanning the width = reading progress | none |

## Annotations (on the canvas, in `type/label`, dim)

- **Hero, motion:** On load the sentence assembles word by word (60 ms apart, ease-out 240 ms each); when the last word lands, the three bubbles peek for 900 ms and settle away. Reduced motion: everything is already in place, no bubbles.
- **Ask, states:** Idle: the result area reads "Ask and the answer comes from the same server Claude Code talks to." Loading: the Ask button is disabled and its keycap pulses (reduced motion: static dim). Error: one body-size line in accent-text, "The server did not answer. Try again." Component mode: the field is a text input with a datalist of component names, prefilled "Button"; Tokens mode: no field.
- **Footer:** Reading progress, fixed to the bottom of the viewport, 7 segments (one per section); the current segment follows the section in view. The main content keeps enough bottom padding that the bar never covers it.
- **Phone:** the type ramp has no role between title (19) and reading (57), and 57 px cannot fit "hääleõiguslik" in 342 px. The phone frame uses proposed narrow sizes, detached from the styles on purpose: sentence 36/44, section headings 44/48. No keycaps on buttons (no keyboard); bubbles do not peek on load; the reading-progress bar stays at the bottom.

## Phone frame `17:260`

Compact nav (`Lause` + the Light/Dark dial), the hero (sentence, promise, stacked buttons), Components as one column (Keycap, Button, Dial shown; the rest follow), Install, the progress footer.

## Rulings made while drawing

1. Separate Figma file for the site; the library file is never edited (Rock, 2026-09-05).
2. Hero sentence in Headline, not Display: at 143 px the 11-word sentence runs to about seven lines.
3. The site Nav shows four items (Tokens · Components · Reader · Ask) because the Nav component has four item slots; Story is the top of the page and Install is reached from the footer links.
4. Sentence, Nav and CellGrid cards span the full width (their components are 1020, 1312 and 712 px wide); the other ten cards sit two per row.
5. The Ask panel is its own section, as the plan drew it (question c below asks whether it should also be a ⌘K overlay).

## Questions for Rock

- **(a) Hero motion**: keep the assembling sentence and the peeking bubbles, or a static hero?
- **(b) Card grid**: two columns as drawn, or three (cards would be 421 px wide; the Dial and Tile still fit, the Bubble example gets tight)?
- **(c) Ask panel**: its own section as drawn, or also a ⌘K overlay reachable from every section (the hero button already says ⌘K)?
- **(d) Narrow type**: the ramp has nothing between 19 and 57 px. Options: add responsive type tokens (`type.reading` and `type.headline` get a narrow value below 640 px: 36/44 and 44/48), or keep one ramp and let the phone hero use `title` (19 px) for the sentence. The frame shows the first.

Screenshots (workspace, not committed): `.superpowers/sdd/2026-09-05-docs-site/shots/{desktop,hero,components,ask,phone}.png`.
