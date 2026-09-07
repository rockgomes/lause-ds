# lause-ds

## 0.2.0

### Minor Changes

- fd4e659: Two narrow type roles, reading-narrow (40/74) and headline-narrow (48/53), for viewports below 640px.

### Patch Changes

- 83777bf: Sentence: the term mark no longer skips the ink of descenders, so a marked word with g/j/p/q/y keeps one continuous underline.
- 2a9e44f: Nav: 8px vertical padding so a Dial in its controls has air.
- 02d47ef: Sentence: reading-narrow below 640px so long Estonian words wrap instead of being clipped.

## 0.1.0

### Minor Changes

- ab105ed: First components: Keycap, Button, Progress, Bar, Dial, Tile and TileStack, on the token theme. Styles ship as `lause-ds/styles.css`.
- 2ccc30c: Hover and pressed states on Button, Tile and Dial: one step on the colour scale, driven by the new `ink-hover`, `ink-active`, `ground-hover` and `surface-hover` tokens. Disabled controls do not hover.
- 06eba34: The ice colour ramp is merged into navy: the ground is now navy.100 (#e3ecf7) and every neutral aliases navy. Figma variables: opacity emitted as a percentage.
- c2c713a: The reading components: Bubble, Sentence, Nav, Cell + CellGrid, and the usePeek hook (held modifier, latch, blur clearing). Mark and pin stroke tokens; caps tracking token; `accent-text-on-ink` for small accent text on ink fills. Tile and Cell share `SurfaceState`; `filled` reads as pressed and `dimmed` as disabled to assistive technology.
