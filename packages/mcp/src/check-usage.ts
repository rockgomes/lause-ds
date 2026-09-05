import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findRoot, type Data } from './data.js';

export type Finding = { rule: string; line: number; excerpt: string; message: string; fix?: string };

// ---------------------------------------------------------------------------
// Messages (verbatim from the task brief where one was given)
// ---------------------------------------------------------------------------

const RAW_HEX_MESSAGE = 'Use a semantic colour token (bg-ink, text-dim, …)';
const RAW_FONT_MESSAGE = 'Use font-content or font-chrome';
// The brief gives no exact wording for off-theme-utility (unlike the other five rules) — this is
// the wording chosen for it; see the task report for the reasoning.
const OFF_THEME_MESSAGE = 'Use a token from the closed theme instead of this off-theme Tailwind utility (see list_tokens)';
const TILE_MESSAGE = 'Options stack in a TileStack; only the two of a true/false item sit side by side';
const STEM_MESSAGE =
  'Type is used through the roles: text-label, text-body, text-title, text-reading, text-headline, text-display';
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
 * Locates theme.css: the monorepo source (`packages/ui/src/tokens/theme.css`
 * under the workspace root) or, for the published package layout where
 * `findRoot()` falls back to `<package dir>/data`, the bundled copy
 * `copy-data.mjs` places at the same relative path under that data dir.
 */
function loadThemeCss(): string {
  const root = findRoot();
  const candidates = [
    join(root, 'packages/ui/src/tokens/theme.css'),
    join(root, 'data/packages/ui/src/tokens/theme.css'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return readFileSync(path, 'utf8');
  }
  return '';
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

function getThemeSet(): ThemeSet {
  if (!cachedThemeSet) cachedThemeSet = parseThemeSet(loadThemeCss());
  return cachedThemeSet;
}

// ---------------------------------------------------------------------------
// Comment stripping (line numbers and length are preserved)
// ---------------------------------------------------------------------------

function stripComments(code: string): string {
  let out = code.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/\/\/.*$/gm, (m) => ' '.repeat(m.length));
  return out;
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
const FONT_FAMILY_RE = /font-family\s*:/;
const FONT_SIZE_RE = /font-size\s*:/;

// ---------------------------------------------------------------------------
// Rules 3 & 5: class-token classification
// ---------------------------------------------------------------------------

const COLOR_PREFIXES = ['bg-', 'border-', 'ring-', 'outline-', 'decoration-', 'fill-', 'stroke-'];
const SPACING_PREFIXES = [
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

const SIZE_KEYWORDS = new Set(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl']);
const TEXT_ALIGN_KEYWORDS = new Set(['left', 'center', 'right', 'justify']);

/**
 * Static utilities that use a closed-namespace prefix but name a keyword, not
 * a themeable value — e.g. `rounded-full` isn't a radius key, `border-2` (see
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

type ClassFinding = { rule: 'off-theme-utility' | 'stem-without-role'; util: string };

/** Strips a leading `sm:`/`hover:`/`enabled:active:` variant chain and a leading `-` (negative utility). */
function baseUtility(rawToken: string): string {
  const afterVariants = rawToken.split(':').pop() ?? rawToken;
  return afterVariants.startsWith('-') ? afterVariants.slice(1) : afterVariants;
}

/**
 * Classifies one Tailwind utility against the closed theme. Returns null for
 * utilities that are fine (in the theme, an allowlisted keyword, an arbitrary
 * value, or outside the closed namespaces entirely).
 */
function classifyToken(rawToken: string, theme: ThemeSet): ClassFinding | null {
  const token = baseUtility(rawToken);
  if (STATIC_ALLOWLIST.has(token)) return null;

  if (token.includes('[') || token.includes('(')) {
    // Arbitrary values (`p-[13px]`) and variable refs (`bg-(--foo)`) pass, per the brief —
    // except an arbitrary text size, which is still a size outside the six roles.
    if (token.startsWith('text-[')) return { rule: 'stem-without-role', util: token };
    return null;
  }

  if (token.startsWith('text-')) {
    const rest = token.slice('text-'.length);
    if (TEXT_ALIGN_KEYWORDS.has(rest)) return null;
    if (theme.textRoles.has(rest)) return null;
    if (SIZE_KEYWORDS.has(rest)) return { rule: 'stem-without-role', util: token };
    if (theme.color.has(rest)) return null;
    return { rule: 'off-theme-utility', util: token };
  }

  for (const prefix of COLOR_PREFIXES) {
    if (token.startsWith(prefix)) {
      const rest = token.slice(prefix.length);
      if (/^\d+$/.test(rest)) return null; // a width/thickness utility (border-2), not a colour
      if (theme.color.has(rest)) return null;
      return { rule: 'off-theme-utility', util: token };
    }
  }

  for (const prefix of SPACING_PREFIXES) {
    if (token.startsWith(prefix)) {
      const rest = token.slice(prefix.length);
      if (theme.spacing.has(rest)) return null;
      return { rule: 'off-theme-utility', util: token };
    }
  }

  if (token.startsWith('font-')) {
    const rest = token.slice('font-'.length);
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

/** Every class string on a line: `className="…"`/`class="…"` (any quote style) plus `clsx(...)` string literals. */
function extractClassStringsFromLine(line: string): string[] {
  const out: string[] = [];
  const attrRe =
    /(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(line))) {
    out.push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '');
  }
  const clsxRe = /clsx\(([^)]*)\)/g;
  while ((m = clsxRe.exec(line))) {
    const litRe = /"([^"]*)"|'([^']*)'|`([^`]*)`/g;
    let lm: RegExpExecArray | null;
    while ((lm = litRe.exec(m[1]))) out.push(lm[1] ?? lm[2] ?? lm[3] ?? '');
  }
  return out;
}

function tokensOf(classString: string): string[] {
  return classString
    .replace(/\$\{[^}]*\}/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Rules 4 & 6: a light JSX tag walker
// ---------------------------------------------------------------------------

type Tag = { name: string; raw: string; index: number; closing: boolean; selfClosing: boolean };

/**
 * Tokenizes JSX/HTML tags with one regex pass. Assumes attributes don't
 * contain a raw `>` (e.g. an inline arrow-function handler like
 * `onClick={() => f()}`) — a known limitation of a regex-based tokenizer;
 * see the task report.
 */
function tokenizeTags(text: string): Tag[] {
  const tags: Tag[] = [];
  const re = /<\/?([A-Za-z][\w.]*)\b[^<>]*?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = m[0];
    tags.push({
      name: m[1],
      raw,
      index: m.index,
      closing: raw.startsWith('</'),
      selfClosing: /\/\s*>$/.test(raw),
    });
  }
  return tags;
}

function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
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
  const bases = tokensOf(classStr).map((t) => t.split(':').pop() ?? t);
  if (bases.includes('flex-row')) return true;
  if (bases.some((t) => t.startsWith('grid-cols-'))) return true;
  return bases.includes('flex') && !bases.includes('flex-col');
}

function findTileInRow(code: string, rawLines: string[]): Finding[] {
  const findings: Finding[] = [];
  type Frame = { name: string; qualifies: boolean; tileCount: number; line: number };
  const stack: Frame[] = [];
  for (const tag of tokenizeTags(code)) {
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
        line: lineOf(code, tag.index),
      });
    }
  }
  return findings;
}

function findFocusMissing(code: string, rawLines: string[], data: Data): Finding[] {
  const findings: Finding[] = [];
  const componentNames = new Set(data.manifest.components.map((c) => c.name));
  for (const tag of tokenizeTags(code)) {
    if (tag.closing) continue;
    const isRawButton = tag.name === 'button';
    const hasRoleButton = /role\s*=\s*["']button["']/.test(tag.raw);
    if (!isRawButton && !hasRoleButton) continue;
    if (componentNames.has(tag.name)) continue; // a system component is skipped
    const hasFocusRing = /focusRing/.test(tag.raw) || /focus-visible:/.test(tag.raw);
    if (hasFocusRing) continue;
    const line = lineOf(code, tag.index);
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

export function checkUsage(data: Data, code: string): { findings: Finding[] } {
  const theme = getThemeSet();
  const findings: Finding[] = [];
  const rawLines = code.split('\n');
  const strippedLines = stripComments(code).split('\n');

  for (let i = 0; i < rawLines.length; i++) {
    const lineNo = i + 1;
    const stripped = strippedLines[i];
    const excerpt = rawLines[i].trim();

    let hm: RegExpExecArray | null;
    HEX_RE.lastIndex = 0;
    while ((hm = HEX_RE.exec(stripped))) {
      findings.push({ rule: 'raw-hex', line: lineNo, excerpt, message: RAW_HEX_MESSAGE });
    }

    if (FONT_FAMILY_RE.test(stripped) || FONT_NAME_RE.test(stripped)) {
      findings.push({ rule: 'raw-font', line: lineNo, excerpt, message: RAW_FONT_MESSAGE });
    }

    if (FONT_SIZE_RE.test(stripped)) {
      findings.push({ rule: 'stem-without-role', line: lineNo, excerpt, message: STEM_MESSAGE });
    }

    for (const classString of extractClassStringsFromLine(stripped)) {
      for (const token of tokensOf(classString)) {
        const result = classifyToken(token, theme);
        if (!result) continue;
        findings.push({
          rule: result.rule,
          line: lineNo,
          excerpt,
          message: result.rule === 'off-theme-utility' ? OFF_THEME_MESSAGE : STEM_MESSAGE,
        });
      }
    }
  }

  findings.push(...findTileInRow(code, rawLines));
  findings.push(...findFocusMissing(code, rawLines, data));

  findings.sort((a, b) => a.line - b.line);
  return { findings };
}
