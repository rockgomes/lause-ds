---
"lause-ds": minor
"lause-ds-mcp": patch
---

Term and TermText: a word that opens its English at reading or body (16 px) size, and a run of text with its terms, so law text outside the reader can be marked. Bubble gains `size` (`body` for 16 px text). Sentence renders TermText; its line now sits 4 px under the letters instead of 12 px (Rock's rule: the line sits just under the word). TermText takes `live={false}` to skip its live region inside a container that is already one.
