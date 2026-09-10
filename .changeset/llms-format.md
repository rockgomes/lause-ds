---
"lause-ds-mcp": patch
---

llms.txt separates the parts of a token line, and a prop line's doc text, with a vertical bar instead of a dash. A prop line now wraps its type (and default, if any) in backticks, so a union type's own vertical bar is never mistaken for the separator before the doc text.
