# lause-ds

## 0.1.0

### Minor Changes

- ab105ed: First components: Keycap, Button, Progress, Bar, Dial, Tile and TileStack, on the token theme. Styles ship as `lause-ds/styles.css`.
- 2ccc30c: Hover and pressed states on Button, Tile and Dial: one step on the colour scale, driven by the new `ink-hover`, `ink-active`, `ground-hover` and `surface-hover` tokens. Disabled controls do not hover.
- 06eba34: The ice colour ramp is merged into navy: the ground is now navy.100 (#e3ecf7) and every neutral aliases navy. Figma variables: opacity emitted as a percentage.
- c2c713a: The reading components: Bubble, Sentence, Nav, Cell + CellGrid, and the usePeek hook (held modifier, latch, blur clearing). Mark and pin stroke tokens; caps tracking token; `accent-text-on-ink` for small accent text on ink fills. Tile and Cell share `SurfaceState`; `filled` reads as pressed and `dimmed` as disabled to assistive technology.
