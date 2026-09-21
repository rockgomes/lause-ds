# lause-ds-mcp

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
