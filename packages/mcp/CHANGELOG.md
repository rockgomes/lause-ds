# lause-ds-mcp

## 0.1.9

### Patch Changes

- 7cd7498: The body-size Bubble wraps inside 240 px and shifts sideways to stay inside the viewport and its clipping ancestor, with its tail still over the word, so a long gloss at the edge of a narrow panel is never cut or makes the page scroll sideways.

## 0.1.8

### Patch Changes

- d247cbd: Term and TermText: a word that opens its English at reading or body (16 px) size, and a run of text with its terms, so law text outside the reader can be marked. Bubble gains `size` (`body` for 16 px text). Sentence renders TermText; its line now sits 4 px under the letters instead of 12 px (Rock's rule: the line sits just under the word). TermText takes `live={false}` to skip its live region inside a container that is already one.

## 0.1.7

### Patch Changes

- 6a33c4f: Sentence gains `previousLabel` and `nextLabel`: dim caps labels over the neighbour lines ("eelmine lause", "järgmine lause"), so a reader knows what the two dim sentences around the current one are (Rock, 2026-09-21). Without them the neighbours render as before.

## 0.1.6

### Patch Changes

- 465464c: Tile matches the boards' option pills: the chrome face at the title size (semibold sans) instead of the serif reading face, the keycap on the right edge, and taller padding (16px) so a tile reads as a button. Tile's markup order changes: the label span comes first, the keycap second.

## 0.1.5

### Patch Changes

- ccb4c49: Token data names the headline roles at weight 700.

## 0.1.4

### Patch Changes

- deff7f6: Token data names the reading roles at weight 600.

## 0.1.3

### Patch Changes

- 2cb326e: Token data and llms.txt name Source Serif 4 as the content font.

## 0.1.2

### Patch Changes

- f93500c: llms.txt separates the parts of a token line, and a prop line's doc text, with a vertical bar instead of a dash. A prop line now wraps its type (and default, if any) in backticks, so a union type's own vertical bar is never mistaken for the separator before the doc text.

## 0.1.1

### Patch Changes

- 2802ae2: check_usage and the manifest rules name the two narrow type roles.

## 0.1.0

### Minor Changes

- 03fa13d: First release of the MCP server: list_tokens, list_components, get_component, check_usage; npx lause-ds-mcp and a Netlify Function.
