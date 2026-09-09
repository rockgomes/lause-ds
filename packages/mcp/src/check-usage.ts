import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findRoot, type Data } from './data.js';

export type Finding = { rule: string; line: number; excerpt: string; message: string; fix?: string };

// ---------------------------------------------------------------------------
// Messages (verbatim from the task brief where one was given)
// ---------------------------------------------------------------------------

const RAW_HEX_MESSAGE = 'Use a semantic colour token (bg-ink, text-dim, …)';
const RAW_FONT_MESSAGE = 'Use font-content or font-chrome';
// The brief gives no exact wording for off-theme-utility (unlike the other five rules): this is
// the wording chosen for it; see the task report for the reasoning.
const OFF_THEME_MESSAGE = 'Use a token from the closed theme instead of this off-theme Tailwind utility (see list_tokens)';
const RAW_SIZE_MESSAGE =
  'Sizes come from the space and type scales; only 44px (target), 640px (option width) and 1020px (reading measure) are allowed as raw values';
const TILE_MESSAGE = 'Options stack in a TileStack; only the two of a true/false item sit side by side';
const STEM_MESSAGE =
  'Type is used through the roles: text-label, text-body, text-title, text-reading, text-headline, text-display (and text-reading-narrow, text-headline-narrow below 640px)';
const FOCUS_MESSAGE =
  "Every interactive element needs the focus ring (import focusRing from lause-ds' styles or use the components)";

// ---------------------------------------------------------------------------
// The closed theme, read once from theme.css
// ---------------------------------------------------------------------------

type ThemeSet = {
  color: Set<string>;
  spacing: Set<string>;
  textRoles: Set<string>;
  font: Set<string>;
  radius: Set<string>;
  shadow: Set<string>;
  leading: Set<string>;
  tracking: Set<string>;
};

/**
 * The closed-theme source CSS. Prefers `data.themeCss`, the hosted Netlify
 * function's bundled text (see `dataFromBundle`), which has no filesystem to
 * fall back to. Otherwise reads the monorepo source
 * (`packages/ui/src/tokens/theme.css` under the workspace root) or, for the
 * published package layout where `findRoot()` falls back to
 * `<package dir>/data`, the bundled copy `copy-data.mjs` places at the same
 * relative path under that data dir.
 */
function loadThemeCss(data: Data): string {
  if (data.themeCss !== undefined) return data.themeCss;
  const root = findRoot();
  const path = join(root, 'packages/ui/src/tokens/theme.css');
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/**
 * Parses the `@theme inline` custom properties into the allowed key per
 * namespace, e.g. `--color-ink: …` -> color has 'ink'; `--spacing-16: …` ->
 * spacing has '16'; `--text-body--line-height: …` collapses to the same
 * 'body' role as `--text-body: …`. Reset lines (`--color-*: initial;`) never
 * match because `*` isn't a word/hyphen character.
 */
function parseThemeSet(css: string): ThemeSet {
  const sets: ThemeSet = {
    color: new Set(),
    spacing: new Set(),
    textRoles: new Set(),
    font: new Set(),
    radius: new Set(),
    shadow: new Set(),
    leading: new Set(),
    tracking: new Set(),
  };
  const re = /--(color|spacing|text|font|radius|shadow|leading|tracking)-([\w-]+)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const group = m[1];
    const key = m[2].split('--')[0]; // drop a `--line-height` / `--font-weight` sub-property suffix
    switch (group) {
      case 'color':
        sets.color.add(key);
        break;
      case 'spacing':
        sets.spacing.add(key);
        break;
      case 'text':
        sets.textRoles.add(key);
        break;
      case 'font':
        sets.font.add(key);
        break;
      case 'radius':
        sets.radius.add(key);
        break;
      case 'shadow':
        sets.shadow.add(key);
        break;
      case 'leading':
        sets.leading.add(key);
        break;
      case 'tracking':
        sets.tracking.add(key);
        break;
    }
  }
  return sets;
}

let cachedThemeSet: ThemeSet | null = null;

function getThemeSet(data: Data): ThemeSet {
  if (!cachedThemeSet) cachedThemeSet = parseThemeSet(loadThemeCss(data));
  return cachedThemeSet;
}

// ---------------------------------------------------------------------------
// Comment stripping (line numbers and length are preserved)
// ---------------------------------------------------------------------------

/** The index of the closing quote of the literal opening at `open`, or the end of the text. */
function skipString(text: string, open: number): number {
  const quote = text[open];
  let i = open + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) return i;
    // A plain quote never spans a line: an apostrophe in JSX prose
    // ("don't") is not the start of a string literal.
    if (ch === '\n' && quote !== '`') return open;
    i++;
  }
  return quote === '`' ? text.length : open;
}

/**
 * Blanks out comments, preserving every line number and every offset: a
 * comment becomes spaces, newlines stay.
 *
 * The `//` pass is string-aware: it skips over `"…"`, `'…'` and `` `…` ``
 * literals the way `tokenizeTags` does, so the `//` in
 * `href="https://example.com"` no longer blanks the rest of the line, and it
 * refuses a `//` written straight after a `:` or a `\` (a bare URL, and the
 * `\/\/` of a regex literal like `/https?:\/\//`).
 */
function stripComments(code: string): string {
  const out = code.split('');
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const close = skipString(code, i);
      if (close > i) {
        i = close + 1;
        continue;
      }
      i++; // not a literal after all (an unterminated quote, e.g. an apostrophe in prose)
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const stop = end === -1 ? code.length : end + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (ch === '/' && code[i + 1] === '/') {
      const previous = code[i - 1];
      if (previous === ':' || previous === '\\') {
        i += 2;
        continue;
      }
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      blank(i, end);
      i = end;
      continue;
    }
    i++;
  }
  return out.join('');
}

// ---------------------------------------------------------------------------
// Rule 1: raw-hex
// ---------------------------------------------------------------------------

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

// ---------------------------------------------------------------------------
// Rule 2: raw-font
// ---------------------------------------------------------------------------

const FONT_NAMES = ['Young Serif', 'Instrument Sans', 'Inter', 'Georgia', 'Arial', 'system-ui'];
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const FONT_NAME_RE = new RegExp(`\\b(?:${FONT_NAMES.map(escapeRe).join('|')})\\b`, 'i');
const FONT_FAMILY_RE = /font-family\s*:/i;
const FONT_SIZE_RE = /font-size\s*:/;

/**
 * A font name is only a violation inside a styling context: a class
 * attribute value, a `style` attribute (string or object form), a
 * `font-family:` CSS declaration, or a `fontFamily:` JS style key; never in
 * ordinary JSX text or an unrelated string literal ("Georgia is a country.").
 * Each match run is line-scoped; the class strings of that line are passed
 * in, since those are extracted once for the whole document.
 */
function fontContextsOnLine(stripped: string, classStrings: string[]): string[] {
  const contexts: string[] = [...classStrings];

  let m: RegExpExecArray | null;

  const styleAttrStrRe = /style\s*=\s*"([^"]*)"|style\s*=\s*'([^']*)'/g;
  while ((m = styleAttrStrRe.exec(stripped))) contexts.push(m[1] ?? m[2] ?? '');

  const styleObjRe = /style\s*=\s*\{\{([\s\S]*?)\}\}/g;
  while ((m = styleObjRe.exec(stripped))) contexts.push(m[1]);

  const famDeclRe = /font-family\s*:\s*([^;{}\n]*)/gi;
  while ((m = famDeclRe.exec(stripped))) contexts.push(m[1]);

  const fontFamilyKeyRe = /fontFamily\s*:\s*(['"`])((?:(?!\1)[\s\S])*)\1/g;
  while ((m = fontFamilyKeyRe.exec(stripped))) contexts.push(m[2]);

  return contexts;
}

// ---------------------------------------------------------------------------
// Rules 3 & 5: class-token classification
// ---------------------------------------------------------------------------

const COLOR_PREFIXES = ['bg-', 'border-', 'ring-', 'outline-', 'decoration-', 'fill-', 'stroke-'];
const SPACING_PREFIXES = [
  'border-spacing-',
  'min-w-',
  'min-h-',
  'max-w-',
  'max-h-',
  'inset-x-',
  'inset-y-',
  'inset-',
  'space-x-',
  'space-y-',
  'gap-x-',
  'gap-y-',
  'gap-',
  'px-',
  'py-',
  'pt-',
  'pr-',
  'pb-',
  'pl-',
  'p-',
  'mx-',
  'my-',
  'mt-',
  'mr-',
  'mb-',
  'ml-',
  'm-',
  'w-',
  'h-',
  'top-',
  'right-',
  'bottom-',
  'left-',
].sort((a, b) => b.length - a.length);

/** The side segment of a per-side border utility: `border-t-ink`, `border-b-2`. */
const BORDER_SIDE_RE = /^(?:b|t|l|r|x|y|s|e)-/;

const SIZE_KEYWORDS = new Set(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl']);

/**
 * Suffixes that share a closed namespace's prefix but name a CSS keyword
 * rather than a themeable value: `mx-auto` is not a spacing key, `border-b`
 * is not a colour, `text-balance` is not a type role, `font-light` is a
 * weight (weights stay open, see the README) and `bg-cover` is a background
 * size. None of them can be replaced by a token, so none of them is a
 * finding.
 */
const KEYWORD_SUFFIX: Record<string, RegExp> = {
  'text-': /^(?:balance|pretty|wrap|nowrap|ellipsis|clip|left|center|right|justify|start|end)$/,
  'border-': /^(?:b|t|l|r|x|y|s|e|solid|dashed|dotted|double|none|collapse|separate)$/,
  'decoration-': /^(?:solid|dashed|dotted|double|wavy|none|auto|from-font)$/,
  'bg-': /^(?:gradient-.*|linear-.*|radial-.*|conic-.*|cover|contain|auto|center|top|bottom|left|right|none|no-repeat|repeat.*|fixed|local|scroll|clip-.*|origin-.*)$/,
  'font-': /^(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
};

/** The spacing namespace's own keywords: sizing words and fractions (`w-1/2`). */
const SPACING_KEYWORD_RE = /^(?:auto|fit|min|max|full|screen|px|dvh|svh|lvh|\d+\/\d+)$/;

function isKeywordSuffix(prefix: string, rest: string): boolean {
  return KEYWORD_SUFFIX[prefix]?.test(rest) ?? false;
}

/**
 * Static utilities that use a closed-namespace prefix but name a keyword, not
 * a themeable value: `rounded-full` isn't a radius key, `border-2` (see
 * the numeric-width check below) isn't a colour. Kept explicit and small; see
 * the task report for exactly why each one is here.
 */
const STATIC_ALLOWLIST = new Set([
  'text-left',
  'text-center',
  'text-right',
  'text-justify',
  'font-semibold',
  'font-normal',
  'font-medium',
  'font-bold',
  'rounded-full',
  'rounded-none',
  'shadow-none',
  'border-current',
  'border-transparent',
  'bg-transparent',
  'w-full',
  'h-full',
  'w-screen',
  'h-screen',
  'min-h-screen',
  'min-w-full',
  'max-w-none',
  'max-w-full',
  'h-auto',
  'w-auto',
  'underline',
  'uppercase',
  'lowercase',
  'capitalize',
  'normal-case',
  'italic',
  'not-italic',
  'truncate',
]);

type ClassFinding = { rule: 'off-theme-utility' | 'stem-without-role' | 'raw-size'; util: string };

// A variant segment: `sm:`, `hover:`, `enabled:`, `[&>*]:`. Written as a
// prefix match rather than a split on ':' so the colon inside an arbitrary
// value (e.g. `decoration-(length:--lause-stroke-mark)`) is left alone.
const VARIANT_RE = /^(?:\[[^\]]*\]|[\w.@/-]+):/;

/** Strips a leading `sm:`/`hover:`/`enabled:active:` variant chain and a leading `-` (negative utility). */
function baseUtility(rawToken: string): string {
  let token = rawToken;
  for (let m = VARIANT_RE.exec(token); m; m = VARIANT_RE.exec(token)) token = token.slice(m[0].length);
  return token.startsWith('-') ? token.slice(1) : token;
}

// A raw arbitrary length: a bare number + px/rem/em, e.g. `500px`, `2.5rem`.
// A CSS function call (`min(320px,90vw)`, `calc(100% - 8px)`) or a `--variable`
// reference is not a raw magnitude and always passes.
const RAW_SIZE_VALUE_RE = /^-?\d+(?:\.\d+)?(?:px|rem|em)$/i;
const RAW_SIZE_EXCEPTIONS = new Set(['44px', '640px', '1020px']);
const CSS_FUNCTION_RE = /^[a-zA-Z-]+\(/;

function isRawSizeValue(content: string): boolean {
  if (CSS_FUNCTION_RE.test(content)) return false;
  if (RAW_SIZE_EXCEPTIONS.has(content)) return false;
  return RAW_SIZE_VALUE_RE.test(content);
}

/**
 * Classifies one Tailwind utility against the closed theme. Returns null for
 * utilities that are fine (in the theme, an allowlisted keyword, an arbitrary
 * value, or outside the closed namespaces entirely).
 */
function classifyToken(rawToken: string, theme: ThemeSet): ClassFinding | null {
  const token = baseUtility(rawToken);
  if (STATIC_ALLOWLIST.has(token)) return null;

  const bracketMatch = token.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    // An arbitrary text size stays under stem-without-role, never double-reported as raw-size,
    // regardless of what the value is.
    if (token.startsWith('text-[')) return { rule: 'stem-without-role', util: token };
    if (isRawSizeValue(bracketMatch[1])) return { rule: 'raw-size', util: token };
    return null; // other arbitrary values (colours, CSS functions, keywords, …) pass
  }

  if (token.includes('(')) {
    // A `(--variable)` reference, e.g. `pl-(--lause-space-8)`, passes.
    return null;
  }

  if (token.startsWith('text-')) {
    const rest = token.slice('text-'.length);
    if (isKeywordSuffix('text-', rest)) return null;
    if (theme.textRoles.has(rest)) return null;
    if (SIZE_KEYWORDS.has(rest)) return { rule: 'stem-without-role', util: token };
    if (theme.color.has(rest)) return null;
    return { rule: 'off-theme-utility', util: token };
  }

  // Spacing first: `border-spacing-12` is a spacing utility that happens to
  // start with the border prefix.
  for (const prefix of SPACING_PREFIXES) {
    if (token.startsWith(prefix)) {
      const rest = token.slice(prefix.length);
      if (SPACING_KEYWORD_RE.test(rest)) return null;
      if (theme.spacing.has(rest)) return null;
      return { rule: 'off-theme-utility', util: token };
    }
  }

  for (const prefix of COLOR_PREFIXES) {
    if (token.startsWith(prefix)) {
      let rest = token.slice(prefix.length);
      // `border-t-ink` is the top border's colour: judge what follows the side.
      if (prefix === 'border-' && BORDER_SIDE_RE.test(rest)) rest = rest.slice(2);
      if (/^\d+$/.test(rest)) return null; // a width/thickness utility (border-2), not a colour
      if (isKeywordSuffix(prefix, rest)) return null;
      if (theme.color.has(rest)) return null;
      return { rule: 'off-theme-utility', util: token };
    }
  }

  if (token.startsWith('font-')) {
    const rest = token.slice('font-'.length);
    if (isKeywordSuffix('font-', rest)) return null;
    return theme.font.has(rest) ? null : { rule: 'off-theme-utility', util: token };
  }
  if (token.startsWith('rounded-')) {
    const rest = token.slice('rounded-'.length);
    return theme.radius.has(rest) ? null : { rule: 'off-theme-utility', util: token };
  }
  if (token.startsWith('shadow-')) {
    const rest = token.slice('shadow-'.length);
    return theme.shadow.has(rest) ? null : { rule: 'off-theme-utility', util: token };
  }
  if (token.startsWith('leading-')) {
    const rest = token.slice('leading-'.length);
    return theme.leading.has(rest) ? null : { rule: 'off-theme-utility', util: token };
  }
  if (token.startsWith('tracking-')) {
    const rest = token.slice('tracking-'.length);
    return theme.tracking.has(rest) ? null : { rule: 'off-theme-utility', util: token };
  }

  return null; // not a closed-namespace utility (flex, grid-cols-3, items-center, …)
}

/** A class string with the absolute offset of its first character in the document. */
type ClassString = { value: string; index: number };

const CLASS_ATTR_RE =
  /(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;

/** The class-name helpers whose string arguments are class strings. */
const HELPER_CALL_RE = /\b(?:clsx|cn|twMerge|classNames|cva|cx)\s*\(/g;

/** The index of the `)` closing the `(` at `open`, skipping string literals; -1 when unbalanced. */
function matchingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const close = skipString(text, i);
      if (close > i) i = close;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Every string literal between `from` and `to`, with the offset of its content. */
function stringLiteralsIn(text: string, from: number, to: number): ClassString[] {
  const out: ClassString[] = [];
  for (let i = from; i < to; i++) {
    const ch = text[i];
    if (ch !== '"' && ch !== "'" && ch !== '`') continue;
    const close = skipString(text, i);
    if (close <= i) continue;
    out.push({ value: text.slice(i + 1, close), index: i + 1 });
    i = close;
  }
  return out;
}

/**
 * Every class string in the document: a `className`/`class` attribute value
 * (any quote style), and every string literal passed to a class-name helper
 * (`clsx`, `cn`, `twMerge`, `classNames`, `cva`, `cx`) found by balanced,
 * quote-aware parenthesis matching. The whole document, not a line at a time:
 * prettier wraps a long `clsx(...)` call over several lines, and each
 * string keeps its own offset so its findings land on its own line.
 */
function extractClassStrings(text: string): ClassString[] {
  const out: ClassString[] = [];
  let m: RegExpExecArray | null;

  CLASS_ATTR_RE.lastIndex = 0;
  while ((m = CLASS_ATTR_RE.exec(text))) {
    const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
    const relative = m[0].indexOf(value, m[0].indexOf('=') + 1);
    out.push({ value, index: m.index + (relative === -1 ? 0 : relative) });
  }

  HELPER_CALL_RE.lastIndex = 0;
  while ((m = HELPER_CALL_RE.exec(text))) {
    const open = HELPER_CALL_RE.lastIndex - 1;
    const close = matchingParen(text, open);
    if (close === -1) continue;
    out.push(...stringLiteralsIn(text, open + 1, close));
    // Literals of a nested helper call are already collected above.
    HELPER_CALL_RE.lastIndex = close;
  }

  out.sort((a, b) => a.index - b.index);
  return out;
}

/** A class token with the absolute offset it was written at. */
type ClassToken = { value: string; index: number };

/** The whitespace-separated tokens of a class string; `${…}` interpolations are blanked out. */
function tokensOf(classString: ClassString): ClassToken[] {
  const value = classString.value.replace(/\$\{[^}]*\}/g, (m) => ' '.repeat(m.length));
  const out: ClassToken[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) out.push({ value: m[0], index: classString.index + m.index });
  return out;
}

// ---------------------------------------------------------------------------
// Rules 4 & 6: a light JSX tag walker
// ---------------------------------------------------------------------------

type Tag = { name: string; raw: string; index: number; closing: boolean; selfClosing: boolean };

const TAG_START_RE = /<(\/)?([A-Za-z][\w.]*)/y;

/**
 * Tokenizes JSX/HTML tags with a small scanner rather than a single regex.
 * From each `<name`, it walks forward tracking `{}` depth (a `>` inside a
 * brace-expression, e.g. the arrow in `onClick={() => f()}`, or a
 * comparison like `{(e) => { if (x > 1) go(); }}`; never ends the tag) and
 * skips over `"…"`, `'…'` and `` `…` `` string literals verbatim, so a `>`
 * or unbalanced brace inside a quoted attribute value can't confuse the
 * depth count either. The tag ends at the first `>` seen at depth 0.
 */
function tokenizeTags(text: string): Tag[] {
  const tags: Tag[] = [];
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('<', i);
    if (start === -1) break;
    TAG_START_RE.lastIndex = start;
    const m = TAG_START_RE.exec(text);
    if (!m) {
      i = start + 1;
      continue;
    }
    const closing = m[1] === '/';
    const name = m[2];
    let k = TAG_START_RE.lastIndex;
    let braceDepth = 0;
    let end = -1;
    while (k < text.length) {
      const ch = text[k];
      if (ch === '"' || ch === "'" || ch === '`') {
        const quote = ch;
        k++;
        while (k < text.length && text[k] !== quote) {
          if (text[k] === '\\') k++;
          k++;
        }
        k++; // consume the closing quote
        continue;
      }
      if (ch === '{') {
        braceDepth++;
        k++;
        continue;
      }
      if (ch === '}') {
        if (braceDepth > 0) braceDepth--;
        k++;
        continue;
      }
      if (ch === '>' && braceDepth === 0) {
        end = k;
        break;
      }
      k++;
    }
    if (end === -1) {
      // Unterminated (or not actually a tag, e.g. `a < b` in an expression); bail from here.
      i = start + 1;
      continue;
    }
    const raw = text.slice(start, end + 1);
    tags.push({
      name,
      raw,
      index: start,
      closing,
      selfClosing: /\/\s*>$/.test(raw),
    });
    i = end + 1;
  }
  return tags;
}

/**
 * The offset each line starts at, built once per `checkUsage` call. Counting
 * newlines from the start of the document for every finding is what made the
 * check quadratic on a large file; `lineOf` binary-searches this instead.
 */
function buildLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return starts;
}

/** The 1-based line holding `index`, by binary search over `lineStarts`. */
function lineOf(lineStarts: number[], index: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (lineStarts[mid] <= index) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

function classAttrOf(tagRaw: string): string {
  const m = /(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/.exec(
    tagRaw,
  );
  if (!m) return '';
  return m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
}

/** flex-row, any grid-cols-*, or flex without flex-col. */
function qualifiesAsRow(classStr: string): boolean {
  const bases = tokensOf({ value: classStr, index: 0 }).map((t) => t.value.split(':').pop() ?? t.value);
  if (bases.includes('flex-row')) return true;
  if (bases.some((t) => t.startsWith('grid-cols-'))) return true;
  return bases.includes('flex') && !bases.includes('flex-col');
}

function findTileInRow(tags: Tag[], rawLines: string[], lineStarts: number[]): Finding[] {
  const findings: Finding[] = [];
  type Frame = { name: string; qualifies: boolean; tileCount: number; line: number };
  const stack: Frame[] = [];
  for (const tag of tags) {
    if (tag.closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === tag.name) {
          const [frame] = stack.splice(i, 1);
          if (frame.qualifies && frame.tileCount >= 3) {
            findings.push({
              rule: 'tile-in-row',
              line: frame.line,
              excerpt: (rawLines[frame.line - 1] ?? '').trim(),
              message: TILE_MESSAGE,
            });
          }
          break;
        }
      }
      continue;
    }
    if (stack.length > 0 && tag.name === 'Tile') stack[stack.length - 1].tileCount++;
    if (!tag.selfClosing) {
      stack.push({
        name: tag.name,
        qualifies: qualifiesAsRow(classAttrOf(tag.raw)),
        tileCount: 0,
        line: lineOf(lineStarts, tag.index),
      });
    }
  }
  return findings;
}

function findFocusMissing(tags: Tag[], rawLines: string[], lineStarts: number[], data: Data): Finding[] {
  const findings: Finding[] = [];
  const componentNames = new Set(data.manifest.components.map((c) => c.name));
  for (const tag of tags) {
    if (tag.closing) continue;
    const isRawButton = tag.name === 'button';
    const hasRoleButton = /role\s*=\s*["']button["']/.test(tag.raw);
    if (!isRawButton && !hasRoleButton) continue;
    if (componentNames.has(tag.name)) continue; // a system component is skipped
    const hasFocusRing = /focusRing/.test(tag.raw) || /focus-visible:/.test(tag.raw);
    if (hasFocusRing) continue;
    const line = lineOf(lineStarts, tag.index);
    findings.push({
      rule: 'focus-missing',
      line,
      excerpt: (rawLines[line - 1] ?? '').trim(),
      message: FOCUS_MESSAGE,
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// checkUsage
// ---------------------------------------------------------------------------

/**
 * Runs every rule over one snippet. The document is scanned once for tags,
 * once for class strings and once for line starts; each rule reads those
 * shared results rather than re-scanning, so the cost is linear in the
 * length of the snippet.
 */
export function checkUsage(data: Data, code: string): { findings: Finding[] } {
  const theme = getThemeSet(data);
  const findings: Finding[] = [];
  const rawLines = code.split('\n');
  const stripped = stripComments(code);
  const strippedLines = stripped.split('\n');
  const lineStarts = buildLineStarts(code);
  const excerptOf = (line: number) => (rawLines[line - 1] ?? '').trim();

  const classStrings = extractClassStrings(stripped);
  const classStringsByLine = new Map<number, string[]>();
  for (const classString of classStrings) {
    const line = lineOf(lineStarts, classString.index);
    const existing = classStringsByLine.get(line);
    if (existing) existing.push(classString.value);
    else classStringsByLine.set(line, [classString.value]);
  }

  for (let i = 0; i < rawLines.length; i++) {
    const lineNo = i + 1;
    const strippedLine = strippedLines[i] ?? '';
    const excerpt = rawLines[i].trim();

    let hm: RegExpExecArray | null;
    HEX_RE.lastIndex = 0;
    while ((hm = HEX_RE.exec(strippedLine))) {
      findings.push({ rule: 'raw-hex', line: lineNo, excerpt, message: RAW_HEX_MESSAGE });
    }

    const hasFontDecl = FONT_FAMILY_RE.test(strippedLine);
    const hasFontNameInContext = fontContextsOnLine(strippedLine, classStringsByLine.get(lineNo) ?? []).some((c) =>
      FONT_NAME_RE.test(c),
    );
    if (hasFontDecl || hasFontNameInContext) {
      findings.push({ rule: 'raw-font', line: lineNo, excerpt, message: RAW_FONT_MESSAGE });
    }

    if (FONT_SIZE_RE.test(strippedLine)) {
      findings.push({ rule: 'stem-without-role', line: lineNo, excerpt, message: STEM_MESSAGE });
    }
  }

  for (const classString of classStrings) {
    for (const token of tokensOf(classString)) {
      const result = classifyToken(token.value, theme);
      if (!result) continue;
      const message =
        result.rule === 'off-theme-utility'
          ? OFF_THEME_MESSAGE
          : result.rule === 'raw-size'
            ? RAW_SIZE_MESSAGE
            : STEM_MESSAGE;
      const line = lineOf(lineStarts, token.index);
      findings.push({ rule: result.rule, line, excerpt: excerptOf(line), message });
    }
  }

  const tags = tokenizeTags(code);
  findings.push(...findTileInRow(tags, rawLines, lineStarts));
  findings.push(...findFocusMissing(tags, rawLines, lineStarts, data));

  findings.sort((a, b) => a.line - b.line);
  return { findings };
}
