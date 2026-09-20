# lause-ds

## 0.5.0

### Minor Changes

- 465464c: Tile matches the boards' option pills: the chrome face at the title size (semibold sans) instead of the serif reading face, the keycap on the right edge, and taller padding (16px) so a tile reads as a button. Tile's markup order changes: the label span comes first, the keycap second.

## 0.4.2

### Patch Changes

- ccb4c49: The headline roles (headline, headline-narrow) are weight 700. Reading stays 600, display and chrome stay as they were.

## 0.4.1

### Patch Changes

- deff7f6: The reading roles (reading, reading-narrow) are weight 600 for legibility. Headlines, display and chrome stay as they were.

## 0.4.0

### Minor Changes

- 2cb326e: The content typeface is Source Serif 4 (was Young Serif): a reading serif with optical sizes and clearer diacritics. Load it with opsz,wght@8..60,400..600 from Google Fonts.

### Patch Changes

- a833d20: Bubble: sits just above the letters of its word, not above the font box.

## 0.3.1

### Patch Changes

- 6ddfddc: Bubble: one line from 640px up, so a gloss wider than its word never covers the line above. Below 640px it still wraps inside the column until phones get their own gloss note.

## 0.3.0

### Minor Changes

- 6e8a758: Export the shared class strings focusRing, disabledControl, hitTarget and hoverFade, and the SurfaceState type, so consumers style their own links and controls the way the components do.

### Patch Changes

- afe9006: Keycap: drop a leading-none class the closed theme never defined. No visual change.

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
