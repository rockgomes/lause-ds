# Plan 8: Term and TermText (lause-ds 0.7.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A reusable word button, `Term`, at reading and body size, and `TermText`, a run of text with its terms, so the trainer app can mark words in 16 px law text; `Sentence` uses them and its line moves to 4 px under the letters.

**Architecture:** `Term` is extracted from the inline term JSX in `Sentence.tsx` into `packages/ui/src/Term/Term.tsx`, together with the `Term`, `Segment` and `Support` types it needs, plus a `size` prop. `TermText` (`packages/ui/src/TermText/TermText.tsx`) maps segments to `Term`s and owns the live region that `Sentence` owned. `Sentence` renders `TermText size="reading"`. `Bubble` gains `size`. Then the exports, the generated manifest, the docs site gallery, a changeset, and the Figma library.

**Tech Stack:** npm workspaces, React 19, TypeScript 7, Tailwind 4 closed theme, Storybook 10.6 stories as vitest browser tests with axe, changesets, the Figma MCP (`use_figma`).

**Spec:** `/Users/rockgomes/Dev/estonian-citizenship-test/docs/superpowers/specs/2026-10-06-trainer-app-word-marks-design.md` (sections 2 and 3 are this plan's part; section 4 is the app's later plan). Design system spec: `docs/specs/2026-09-03-lause-ds-design.md`.

## Global Constraints

- The Tailwind theme is closed: only token utilities exist. CSS-variable utilities use the paren form, for example `decoration-(length:--lause-stroke-thin)`, `underline-offset-(length:--lause-space-4)`.
- The line sits 4 px under the letters at both sizes: `underline-offset-(length:--lause-space-4)`.
- Reading size: idle `decoration-dotted decoration-(length:--lause-stroke-mark)` (3 px), pinned `decoration-solid decoration-(length:--lause-stroke-pin)` (4 px).
- Body size: idle `decoration-dotted decoration-(length:--lause-stroke-thin)` (1.5 px), pinned `decoration-solid decoration-(length:--lause-stroke-mark)` (3 px).
- At body size the bubble uses `text-body`, not `text-title`.
- `Sentence` keeps its props and its markup outside the terms.
- No em dashes (U+2014) anywhere: code, comments, docs, commit messages, generated files, changesets. Use a comma, a colon, a full stop or brackets.
- Docs and comments in English. Only sample copy is Estonian.
- Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Generated files (`components.manifest.json`, `llms.txt`) are committed and CI fails if they drift: run `npm run build:manifest` after changing exports, docs or stories, and commit the output.
- Run from the repo root. `npm test` runs every project. Single project: `npx vitest run --project ui`, `--project mcp`, `--project site`. The `site` project needs `packages/ui/dist` (run `npm run build:ui` first). Also `npm run typecheck` and `npm run check:site`.
- No subagents dispatched by implementers. No pushes by implementers.

## Review Focus

1. Existing `Sentence` stories (Tugi, Gap, GapNarrow, Weight, Keyboard, TwoPins, Peeking, EestiKeeles and the rest) pass unedited after the extraction: same roles, names, `data-*` attributes and live-region text (Task 3 runs them unedited).
2. Two occurrences that share an id pin together inside `TermText` as they do in `Sentence` (Task 3 story `SharedId`).
3. At body size the term keeps the surrounding font family (sans in an app panel, serif in an explanation), it never forces `font-content` (Task 2 story `BodyInheritsFont`).
4. The body bubble does not overlap the word it belongs to: its bottom, tail included, sits above the letters (Task 2 story `BodyGap`, the `Gap` measurement at 16 px).
5. The reader-size line is 4 px under the letters, not 12 px (Task 3 story `LineOffset`).

---

### Task 1: `Bubble` gains `size`

**Files:**
- Modify: `packages/ui/src/Bubble/Bubble.tsx`
- Modify: `packages/ui/src/Bubble/Bubble.stories.tsx`

**Interfaces:**
- Produces: `BubbleProps['size']?: 'title' | 'body'` (default `'title'`).

- [ ] **Step 1: Write the failing story**

Append to `packages/ui/src/Bubble/Bubble.stories.tsx`:

```tsx
/** At body size (a 16 px panel) the bubble uses body text, so it covers less of the line above. */
export const Body: Story = {
  args: { children: 'secret', count: 2, size: 'body' },
  render: (args) => (
    <p className="mt-64 font-chrome text-body">
      <span className="relative">
        salajasel
        <Bubble {...args} />
      </span>
    </p>
  ),
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    await expect(getComputedStyle(note).fontSize).toBe('16px');
  },
};

export const TitleByDefault: Story = {
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    await expect(getComputedStyle(note).fontSize).toBe('19px');
  },
};
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --project ui packages/ui/src/Bubble`
Expected: FAIL in `Body` (font size 19px, expected 16px) and a type error on `size` in `npm run typecheck`.

- [ ] **Step 3: Implement**

In `packages/ui/src/Bubble/Bubble.tsx` add the prop and split the size out of the class string:

```tsx
export type BubbleProps = Omit<ComponentProps<'span'>, 'children'> & {
  /** The translation. */
  children: ReactNode;
  /** How many times this term has been looked up; shown as ×N in accent. */
  count?: number;
  /** A short note after the count, e.g. the app's promotion text. */
  note?: string;
  /** title: over reading-size text (the reader). body: over 16 px text, so it covers less of the line above. */
  size?: 'title' | 'body';
};
```

and in the function: destructure `size = 'title'`, and replace `text-title` in the long class string with nothing, adding `size === 'body' ? 'text-body' : 'text-title'` as the next `clsx` argument after it.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui packages/ui/src/Bubble` and `npm run typecheck`
Expected: PASS, every Bubble story including the existing ones.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Bubble
git commit -m "feat(ui): Bubble gains size, body for 16 px text

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `Term`

**Files:**
- Create: `packages/ui/src/Term/Term.tsx`
- Create: `packages/ui/src/Term/Term.stories.tsx`

**Interfaces:**
- Consumes: `Bubble` with `size` (Task 1); `focusRing`, `hoverFade` from `packages/ui/src/styles.ts`.
- Produces (all from `packages/ui/src/Term/Term.tsx`):
  ```ts
  export type Term = { id: string; text: string; gloss: string };   // moved from Sentence.tsx, same doc comments
  export type Segment = string | Term;                                // moved from Sentence.tsx
  export type Support = 'et' | 'tugi' | 'korvuti';                    // moved from Sentence.tsx
  export type TermSize = 'reading' | 'body';
  export type TermProps = {
    id: string; text: string; gloss: string; size: TermSize; marked: boolean; pinned: boolean;
    peeking?: boolean; count?: number; note?: string; onToggle: (id: string) => void;
  };
  export function Term(props: TermProps): JSX.Element;
  export function isTerm(s: Segment): s is Term;
  ```
  A type alias and a function share the name `Term` on purpose (different namespaces): one export name serves both.

- [ ] **Step 1: Write the failing stories**

Create `packages/ui/src/Term/Term.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Term, type TermProps } from './Term.js';
import { restFocus } from '../test-utils.js';

function Controlled(props: TermProps) {
  const [pinned, setPinned] = useState(props.pinned);
  return <Term {...props} pinned={pinned} onToggle={(id) => { props.onToggle(id); setPinned(!pinned); }} />;
}

/** Body size inside a 16 px sans paragraph, the way the app's panels use it. */
function BodyLine(props: TermProps) {
  return (
    <p className="mt-64 font-chrome text-body text-ink">
      Riigikogu valib Vabariigi Presidendi <Controlled {...props} /> hääletusel.
    </p>
  );
}

/** Reading size inside a reading paragraph, the way Sentence uses it. */
function ReadingLine(props: TermProps) {
  return (
    <p className="mt-64 font-content text-reading-narrow sm:text-reading text-ink">
      Riigikogusse võib <Controlled {...props} />.
    </p>
  );
}

const meta = {
  title: 'Term',
  component: Term,
  args: { id: 'salajane', text: 'salajasel', gloss: 'secret', size: 'body', marked: true, pinned: false, count: 1, onToggle: fn() },
  render: (args) => <BodyLine {...args} />,
} satisfies Meta<typeof Term>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The letters' visible top from real font metrics (the same helper as Sentence.stories.tsx). */
function measureLetterTop(term: Element): number {
  const el = term as HTMLElement;
  const style = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = style.font || `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const m = ctx.measureText(el.textContent ?? '');
  const fontBox = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  const halfLeading = (Number.parseFloat(style.lineHeight) - fontBox) / 2;
  return el.getBoundingClientRect().top + halfLeading + (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent);
}

export const BodyIdle: Story = {
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'salajasel' });
    const s = getComputedStyle(term);
    await expect(term).toHaveAttribute('data-size', 'body');
    await expect(term).toHaveAttribute('data-marked', 'true');
    await expect(s.textDecorationLine).toContain('underline');
    await expect(s.textDecorationStyle).toBe('dotted');
    await expect(s.textDecorationThickness).toBe('1.5px');
    await expect(s.textUnderlineOffset).toBe('4px');
    await expect(s.fontSize).toBe('16px');
  },
};

export const BodyPinned: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await userEvent.click(term);
    await expect(args.onToggle).toHaveBeenLastCalledWith('salajane');
    await expect(term).toHaveAttribute('aria-pressed', 'true');
    await expect(term).toHaveAttribute('data-state', 'pinned');
    const s = getComputedStyle(term);
    await expect(s.textDecorationStyle).toBe('solid');
    await expect(s.textDecorationThickness).toBe('3px');
    const note = canvas.getByRole('note');
    await expect(note).toHaveTextContent('secret');
    await expect(note).toHaveTextContent('×1');
    await expect(getComputedStyle(note).fontSize).toBe('16px');
    await expect(term).toHaveAttribute('aria-describedby', note.id);
    restFocus();
  },
};

export const BodyGap: Story = {
  name: 'the body bubble sits above the letters',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await userEvent.click(term);
    const note = canvas.getByRole('note');
    const gap = measureLetterTop(term) - (note.getBoundingClientRect().bottom + 8);
    await expect(gap).toBeGreaterThanOrEqual(0);
    await expect(gap).toBeLessThanOrEqual(16);
    restFocus();
  },
};

export const BodyInheritsFont: Story = {
  name: 'body size keeps the paragraph font',
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'salajasel' });
    const p = term.closest('p')!;
    await expect(getComputedStyle(term).fontFamily).toBe(getComputedStyle(p).fontFamily);
  },
};

export const ReadingIdle: Story = {
  args: { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate', size: 'reading' },
  render: (args) => <ReadingLine {...args} />,
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'kandideerida' });
    const s = getComputedStyle(term);
    await expect(s.textDecorationStyle).toBe('dotted');
    await expect(s.textDecorationThickness).toBe('3px');
    await expect(s.textUnderlineOffset).toBe('4px');
  },
};

export const ReadingPinned: Story = {
  args: { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate', size: 'reading', pinned: true },
  render: (args) => <ReadingLine {...args} />,
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'kandideerida' });
    const s = getComputedStyle(term);
    await expect(s.textDecorationStyle).toBe('solid');
    await expect(s.textDecorationThickness).toBe('4px');
    await expect(getComputedStyle(within(canvasElement).getByRole('note')).fontSize).toBe('19px');
  },
};

export const Unmarked: Story = {
  name: 'unmarked (Eesti keeles): no line, still opens',
  args: { marked: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await expect(term).toHaveAttribute('data-marked', 'false');
    await expect(getComputedStyle(term).textDecorationLine).toBe('none');
    await userEvent.click(term);
    await expect(canvas.getByRole('note')).toHaveTextContent('secret');
    restFocus();
  },
};

export const Peeked: Story = {
  args: { peeking: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await expect(term).toHaveAttribute('data-peeked', 'true');
    await expect(term).toHaveAttribute('data-state', 'idle');
    await expect(canvas.getByRole('note')).toHaveTextContent('secret');
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <div className="flex flex-col gap-24">
      <BodyLine {...args} />
      <BodyLine {...args} pinned />
      <ReadingLine {...args} size="reading" pinned />
    </div>
  ),
};
```

`Dark` switches the mode with `globals: { theme: 'dark' }`, as `Tile.stories.tsx` does.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui packages/ui/src/Term`
Expected: FAIL, `Failed to resolve import "./Term.js"`.

- [ ] **Step 3: Implement**

Create `packages/ui/src/Term/Term.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { useId } from 'react';
import { Bubble } from '../Bubble/Bubble.js';
import { focusRing, hoverFade } from '../styles.js';

export type Term = {
  /** Identifies the term for pinning and counting. Occurrences that share an id pin and count together; give each occurrence its own id if they must be independent. */
  id: string;
  text: string;
  gloss: string;
};
export type Segment = string | Term;
export type Support = 'et' | 'tugi' | 'korvuti';
export type TermSize = 'reading' | 'body';

export const isTerm = (s: Segment): s is Term => typeof s !== 'string';

export type TermProps = {
  /** The term's id; onToggle is called with it. */
  id: string;
  /** The word as written. */
  text: string;
  /** Its English, shown in the bubble. */
  gloss: string;
  /** reading: the reader's 40 to 57 px text. body: 16 px text, which keeps the paragraph's font. */
  size: TermSize;
  /** The underline (the Tugi and Kõrvuti levels). Unmarked terms still open on click. */
  marked: boolean;
  /** The bubble shows and the line turns solid. */
  pinned: boolean;
  /** While true the bubble shows, pinned or not. */
  peeking?: boolean;
  /** Look-up tally, shown in the bubble. */
  count?: number;
  /** Shown after the count, e.g. the promotion text at three look-ups. */
  note?: string;
  /** Called with the id when the term is clicked or opened with Enter or Space. */
  onToggle: (id: string) => void;
};

// The line sits 4 px under the letters at both sizes (Rock's rule; the hero fix f254e71).
const LINE = 'underline decoration-accent underline-offset-(length:--lause-space-4) [text-decoration-skip-ink:none]';
const WEIGHT: Record<TermSize, { idle: string; pinned: string }> = {
  reading: { idle: 'decoration-dotted decoration-(length:--lause-stroke-mark)', pinned: 'decoration-solid decoration-(length:--lause-stroke-pin)' },
  body: { idle: 'decoration-dotted decoration-(length:--lause-stroke-thin)', pinned: 'decoration-solid decoration-(length:--lause-stroke-mark)' },
};
// Body size sets no font family: the term reads in its paragraph's font (sans in a panel, serif in
// an explanation); the button inherits it through Tailwind's preflight.
const TEXT: Record<TermSize, string> = {
  reading: 'font-content text-reading-narrow sm:text-reading',
  body: 'text-body',
};

/** One word that opens its English: marked in Tugi and Kõrvuti, the bubble above it when pinned or peeked. */
export function Term({ id, text, gloss, size, marked, pinned, peeking = false, count, note, onToggle }: TermProps) {
  const bubbleId = useId();
  const shown = pinned || peeking;
  return (
    <span className="relative inline">
      <button
        type="button"
        aria-pressed={pinned}
        aria-describedby={shown ? bubbleId : undefined}
        data-state={pinned ? 'pinned' : 'idle'}
        data-peeked={shown ? 'true' : undefined}
        data-marked={marked}
        data-size={size}
        onClick={() => onToggle(id)}
        className={clsx(
          'inline cursor-pointer rounded-keycap text-ink',
          TEXT[size],
          focusRing,
          hoverFade,
          marked && LINE,
          marked && (pinned ? WEIGHT[size].pinned : WEIGHT[size].idle),
          'hover:bg-ground-hover',
        )}
      >
        {text}
      </button>
      {shown ? (
        <Bubble id={bubbleId} lang="en" size={size === 'body' ? 'body' : 'title'} count={count} note={note}>
          {gloss}
        </Bubble>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui packages/ui/src/Term` and `npm run typecheck`
Expected: PASS (10 stories, axe clean). If `BodyGap` fails because the gap is below 0 (the bubble touches the letters), report it with the measured value; do not loosen the bound.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Term
git commit -m "feat(ui): Term, one word that opens its English, at reading and body size

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `TermText`, and `Sentence` renders it

**Files:**
- Create: `packages/ui/src/TermText/TermText.tsx`
- Create: `packages/ui/src/TermText/TermText.stories.tsx`
- Modify: `packages/ui/src/Sentence/Sentence.tsx`
- Modify: `packages/ui/src/Sentence/Sentence.stories.tsx` (append one story only; no existing story changes)

**Interfaces:**
- Consumes: `Term`, `isTerm`, types `Term`, `Segment`, `Support`, `TermSize` from `packages/ui/src/Term/Term.tsx` (Task 2).
- Produces:
  ```ts
  export type TermTextProps = {
    segments: readonly Segment[]; size: TermSize; support: Support; pinned: readonly string[];
    counts?: Readonly<Record<string, number>>; notes?: Readonly<Record<string, string>>;
    peeking?: boolean; onToggle: (termId: string) => void;
  };
  export function TermText(props: TermTextProps): JSX.Element;
  ```
  `Sentence.tsx` keeps exporting the types `Term`, `Segment`, `Support` (re-exported from `Term.tsx`) so `Sentence.stories.tsx` and any `import type { Segment } from './Sentence.js'` keep working.

- [ ] **Step 1: Write the failing stories**

Create `packages/ui/src/TermText/TermText.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TermText, type TermTextProps } from './TermText.js';
import type { Segment } from '../Term/Term.js';
import { restFocus } from '../test-utils.js';

const segments: Segment[] = [
  'Riigikogu ',
  { id: 'valima', text: 'valib', gloss: 'elects' },
  ' Vabariigi Presidendi ',
  { id: 'salajane', text: 'salajasel', gloss: 'secret' },
  ' ',
  { id: 'haaletus', text: 'hääletusel', gloss: 'vote' },
  '.',
];

const shared: Segment[] = [
  'Iga Eesti ',
  { id: 'kodanik', text: 'kodanik', gloss: 'citizen' },
  ' vastutab teise Eesti ',
  { id: 'kodanik', text: 'kodaniku', gloss: 'citizen' },
  ' ees.',
];

function Controlled(props: TermTextProps) {
  const [pinned, setPinned] = useState<string[]>([...props.pinned]);
  const [counts, setCounts] = useState<Record<string, number>>({ ...props.counts });
  return (
    <p className="mt-64 font-chrome text-body text-ink">
      <TermText
        {...props}
        pinned={pinned}
        counts={counts}
        onToggle={(id) => {
          props.onToggle(id);
          if (pinned.includes(id)) setPinned(pinned.filter((p) => p !== id));
          else { setPinned([...pinned, id]); setCounts({ ...counts, [id]: (counts[id] ?? 0) + 1 }); }
        }}
      />
    </p>
  );
}

const meta = {
  title: 'TermText',
  component: TermText,
  args: { segments, size: 'body', support: 'tugi', pinned: [], counts: {}, onToggle: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof TermText>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tugi: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const p = canvasElement.querySelector('p')!;
    await expect(p.textContent).toContain('Riigikogu valib Vabariigi Presidendi salajasel hääletusel.');
    const terms = canvas.getAllByRole('button');
    await expect(terms).toHaveLength(3);
    for (const t of terms) await expect(t).toHaveAttribute('data-marked', 'true');
    await userEvent.click(terms[1]);
    await expect(args.onToggle).toHaveBeenLastCalledWith('salajane');
    await expect(canvas.getByRole('note')).toHaveTextContent('secret');
    const live = canvasElement.querySelector('[aria-live]') as HTMLElement;
    await expect(live).toHaveTextContent('secret');
    restFocus();
  },
};

export const EestiKeeles: Story = {
  args: { support: 'et' },
  play: async ({ canvasElement }) => {
    for (const t of within(canvasElement).getAllByRole('button')) await expect(t).toHaveAttribute('data-marked', 'false');
  },
};

export const SharedId: Story = {
  name: 'two occurrences that share an id pin together',
  args: { segments: shared },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const terms = canvas.getAllByRole('button');
    await userEvent.click(terms[0]);
    await expect(terms[0]).toHaveAttribute('aria-pressed', 'true');
    await expect(terms[1]).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getAllByRole('note')).toHaveLength(2);
    restFocus();
  },
};

export const NoWrapperElement: Story = {
  name: 'renders inline, no element of its own around the text',
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector('p')!;
    // Children of the caller's <p>: text spans, term spans and the live region; no block wrapper.
    for (const child of Array.from(p.children)) await expect(child.tagName).toBe('SPAN');
  },
};
```

Append to `packages/ui/src/Sentence/Sentence.stories.tsx`:

```tsx
export const LineOffset: Story = {
  name: 'the line sits 4 px under the letters',
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Lause 5 / 8' });
    const term = within(region).getAllByRole('button')[0]!;
    await expect(getComputedStyle(term).textUnderlineOffset).toBe('4px');
    await expect(term).toHaveAttribute('data-size', 'reading');
  },
};
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run --project ui packages/ui/src/TermText packages/ui/src/Sentence`
Expected: FAIL: `TermText.js` does not resolve; `LineOffset` gets `12px`; every other Sentence story still passes.

- [ ] **Step 3: Implement `TermText`**

Create `packages/ui/src/TermText/TermText.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Term, isTerm, type Segment, type Support, type TermSize } from '../Term/Term.js';

export type TermTextProps = {
  /** The text in reading order: plain strings and terms. */
  segments: readonly Segment[];
  /** reading: Sentence's 40 to 57 px text. body: 16 px text in the caller's font. */
  size: TermSize;
  /** The dial level. et: no marks, terms still open. tugi and korvuti: marks. */
  support: Support;
  /** Term ids whose bubble is shown. */
  pinned: readonly string[];
  /** Look-up tally per term id, shown in the bubble. */
  counts?: Readonly<Record<string, number>>;
  /** Per-term note shown after the count. */
  notes?: Readonly<Record<string, string>>;
  /** While true every gloss shows, pinned or not. */
  peeking?: boolean;
  /** Called with the term id when a term is clicked or opened with Enter or Space. */
  onToggle: (termId: string) => void;
};

/**
 * A run of text with its terms, inline, with no element of its own: the caller's <p> or <li> keeps
 * its layout. It announces each newly pinned gloss in a polite live region.
 */
export function TermText({ segments, size, support, pinned, counts = {}, notes = {}, peeking = false, onToggle }: TermTextProps) {
  const marked = support !== 'et';
  const prevPinnedRef = useRef(pinned);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const prev = prevPinnedRef.current;
    const newlyPinned = pinned.filter((id) => !prev.includes(id));
    if (newlyPinned.length > 0) {
      const glosses = newlyPinned
        .map((id) => segments.find((seg) => isTerm(seg) && seg.id === id))
        .map((seg) => (seg && isTerm(seg) ? seg.gloss : undefined))
        .filter((gloss): gloss is string => gloss !== undefined);
      setAnnouncement(glosses.join(', '));
    }
    prevPinnedRef.current = pinned;
  }, [pinned]);

  return (
    <>
      {segments.map((seg, i) =>
        isTerm(seg) ? (
          <Term
            key={i}
            id={seg.id}
            text={seg.text}
            gloss={seg.gloss}
            size={size}
            marked={marked}
            pinned={pinned.includes(seg.id)}
            peeking={peeking}
            count={counts[seg.id]}
            note={notes[seg.id]}
            onToggle={onToggle}
          />
        ) : (
          <span key={i}>{seg}</span>
        ),
      )}
      {/* The glosses are English; inside the caller's lang="et" paragraph the region says so. */}
      <span aria-live="polite" lang="en" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
```

- [ ] **Step 4: `Sentence` renders `TermText`**

In `packages/ui/src/Sentence/Sentence.tsx`:
- Delete the `Term`, `Segment`, `Support` type declarations and `isTerm`; add at the top:

  ```tsx
  import { TermText } from '../TermText/TermText.js';
  import type { Segment, Support } from '../Term/Term.js';
  export type { Term, Segment, Support } from '../Term/Term.js';
  ```
- Delete `useId`, `useRef`, `useState`, `useEffect`, `Bubble`, `focusRing`, `hoverFade` imports and the `base`, `marked`, `prevPinnedRef`, `announcement` code that only the terms used.
- Replace the `segments.map(...)` body of the reading `<p lang="et" ...>` with:

  ```tsx
  <TermText segments={segments} size="reading" support={support} pinned={pinned} counts={counts} notes={notes} peeking={peeking} onToggle={onToggle} />
  ```
- Delete the trailing `<p aria-live="polite" className="sr-only">{announcement}</p>`: the live region now lives inside `TermText`.
- Keep every other element, prop, class and `data-*` attribute as it is.

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run --project ui` and `npm run typecheck`
Expected: PASS, all ui stories including every pre-existing Sentence story unedited, `LineOffset` and the four TermText stories.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/TermText packages/ui/src/Sentence
git commit -m "feat(ui): TermText, a run of text with its terms; Sentence renders it, its line 4 px under the letters

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Exports, manifest, docs site, changeset

**Files:**
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/mcp/src/manifest.ts` (`PROOF_SCREENS`, `RULES_BY_COMPONENT`)
- Modify: `packages/mcp/test/manifest.test.ts` (the component names list)
- Regenerate: `components.manifest.json`, `llms.txt`
- Modify: `packages/site/src/sections/examples.tsx` (two examples, `EXAMPLES` entries)
- Create: `.changeset/term-and-termtext.md`

**Interfaces:**
- Consumes: `Term`, `TermText`, their props types and `TermSize` (Tasks 2 and 3).
- Produces: `import { Term, TermText, type TermProps, type TermTextProps, type TermSize } from 'lause-ds'`; `Segment`, `Support` and the `Term` type keep being exported from `'lause-ds'`.

- [ ] **Step 1: Exports**

In `packages/ui/src/index.ts` replace the Sentence line with:

```ts
export { Sentence, type SentenceProps } from './Sentence/Sentence.js';
export { Term, type TermProps, type TermSize, type Segment, type Support } from './Term/Term.js';
export { TermText, type TermTextProps } from './TermText/TermText.js';
```

(`Term` exported once carries both the component and the `Term` type.)

- [ ] **Step 2: Manifest entries**

In `packages/mcp/src/manifest.ts`: add `Term: 'Lugeja, Skeemid'` and `TermText: 'Skeemid'` to `PROOF_SCREENS`, and to `RULES_BY_COMPONENT`:

```ts
  Term: [
    'The line sits 4 px under the letters at both sizes.',
    'Body size keeps the paragraph font; reading size is the content font.',
    'Unmarked terms (Eesti keeles) still open on click.',
  ],
  TermText: ['Renders inline with no element of its own: put it inside the caller\'s <p> or <li>.', 'Term ids that repeat pin together.'],
```

In `packages/mcp/test/manifest.test.ts` the exact list of component names gains the two new ones:

```ts
    expect(names).toEqual(['Bar', 'Bubble', 'Button', 'Cell', 'CellGrid', 'Dial', 'Keycap', 'Nav', 'Progress', 'Sentence', 'Term', 'TermText', 'Tile', 'TileStack', 'usePeek']);
```

(If other tests in `packages/mcp/test/` list the components by name, for example a count, update them the same way and name each one in the report.)

Run: `npm run build:manifest`, then `npx vitest run --project mcp`
Expected: PASS; `components.manifest.json` and `llms.txt` now list `Term` and `TermText` with their props and stories.

- [ ] **Step 3: Docs site examples**

In `packages/site/src/sections/examples.tsx` add `Term` and `TermText` to the `lause-ds` import and:

```tsx
// The Term story's body sample (packages/ui/src/Term/Term.stories.tsx).
function TermExample() {
  const [pinned, setPinned] = useState(false);
  return (
    <p className="mt-64 font-chrome text-body text-ink">
      Riigikogu valib Vabariigi Presidendi{' '}
      <Term id="salajane" text="salajasel" gloss="secret" size="body" marked pinned={pinned} count={pinned ? 1 : undefined} onToggle={() => setPinned(!pinned)} />{' '}
      hääletusel.
    </p>
  );
}

// The TermText story's sample (packages/ui/src/TermText/TermText.stories.tsx).
function TermTextExample() {
  const [pinned, setPinned] = useState<string[]>([]);
  return (
    <p className="mt-64 font-chrome text-body text-ink">
      <TermText
        segments={[
          'Riigikogu ',
          { id: 'valima', text: 'valib', gloss: 'elects' },
          ' Vabariigi Presidendi ',
          { id: 'salajane', text: 'salajasel', gloss: 'secret' },
          ' ',
          { id: 'haaletus', text: 'hääletusel', gloss: 'vote' },
          '.',
        ]}
        size="body"
        support="tugi"
        pinned={pinned}
        onToggle={(id) => setPinned(pinned.includes(id) ? pinned.filter((p) => p !== id) : [...pinned, id])}
      />
    </p>
  );
}
```

and add `Term: TermExample, TermText: TermTextExample,` to `EXAMPLES` in the manifest's order (check `components.manifest.json` for where they land and match it).

Run: `npm run build:ui && npx vitest run --project site && npm run check:site`
Expected: PASS, including `components-section.test.tsx` (one card per manifest component, each with an example) and the axe checks.

- [ ] **Step 4: Changeset**

Create `.changeset/term-and-termtext.md`:

```md
---
"lause-ds": minor
"lause-ds-mcp": patch
---

Term and TermText: a word that opens its English at reading or body (16 px) size, and a run of text with its terms, so law text outside the reader can be marked. Bubble gains `size` (`body` for 16 px text). Sentence renders TermText; its line now sits 4 px under the letters instead of 12 px (Rock's rule: the line sits just under the word).
```

- [ ] **Step 5: Full checks and commit**

Run: `npm run typecheck && npm test && npm run check:site`
Expected: all pass.

```bash
git add packages/ui/src/index.ts packages/mcp/src/manifest.ts packages/mcp/test/manifest.test.ts components.manifest.json llms.txt packages/site/src/sections/examples.tsx .changeset/term-and-termtext.md
git commit -m "feat: export Term and TermText; manifest, docs site gallery, changeset for 0.7.0

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The Figma library

**Files:**
- Modify: the Figma file `https://www.figma.com/design/Fi9CrQ0KzJdpCuwNcWbZKF` (through the Figma MCP `use_figma`; load the `figma:figma-use` skill before the first call)
- Modify: `figma/library.json` (the ledger), then regenerate `components.manifest.json` and `llms.txt`

**Interfaces:**
- Consumes: the ledger entries `.Building Blocks/Term` (set `7:48`, 4 variants, prop `text#7:24`), `Bubble` (component `12:5`), `Sentence` (set `14:322`); the variables `space/4`, `stroke/thin`, `stroke/mark`, `stroke/pin` (ids in `figma/library.json` under `variables`).
- Produces: a public `Term` component set on its own page `Term` with variants `size=reading|body` × `marked=true|false` × `state=idle|pinned`; `Bubble` with a `size=title|body` property; the ledger's `components.Term` entry (`setId`, `docId`, `variants`, `props`, `source: packages/ui/src/Term/Term.tsx`).

- [ ] **Step 1: Check the connection**

Load the `figma:figma-use` skill, then read the file's pages through `use_figma`. If the call fails (no connection, no access), STOP and report BLOCKED with the error: Rock connects Figma; this step is never skipped.

- [ ] **Step 2: Promote and extend Term**

- Move the `.Building Blocks/Term` set to a new page `Term` placed after `Bubble`, rename it `Term`, and add the `size` axis: the existing 4 variants become `size=reading`; add 4 `size=body` variants at 16 px with the paragraph font (Instrument Sans body role), keeping `text#7:24`.
- Text decoration on every marked variant: underline, colour `color/accent`, offset bound to `space/4` (4 px). Reading: idle dotted, thickness `stroke/mark`; pinned solid, `stroke/pin`. Body: idle dotted, `stroke/thin`; pinned solid, `stroke/mark`. If the Figma API cannot set a dotted underline or bind the offset or thickness to a variable, set the literal value, and write the gap into the ledger's `rulings` (for example `"Term: Figma underlines cannot be dotted; dotted shown as dashed"`).
- Set the component set's documentation link to `packages/ui/src/Term/Term.tsx` as the other sets have.
- `Sentence` uses the Term instances: confirm its variants now show the line 4 px under the letters (they follow the main component).

- [ ] **Step 3: Bubble size**

Add a `size` variant property to `Bubble` (`title` existing, `body` with the body text style). If `Bubble` is a single component (`componentId 12:5`), combine it into a set with the two variants and record the new `setId` in the ledger.

- [ ] **Step 4: Ledger and manifest**

Update `figma/library.json`: add `components.Term` (`setId`, `docId`, `variants: 8`, `props`, `source`, `codeConnect` as the other entries), remove `.Building Blocks/Term` from `buildingBlocks`, add `pages.Term`, update `components.Bubble`. Then run `npm run build:manifest && npx vitest run --project mcp`.
Expected: PASS; `components.manifest.json` shows a `figma` entry for `Term`.

- [ ] **Step 5: Screenshot and commit**

Take a screenshot of the `Term` page through the MCP and save it to `docs/superpowers/plans/2026-10-06-term-figma.png`.

```bash
git add figma/library.json components.manifest.json llms.txt docs/superpowers/plans/2026-10-06-term-figma.png
git commit -m "feat(figma): Term at reading and body size, the line 4 px under the letters; Bubble body size

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Publishing the library update is a click in Figma's Assets panel: report it as Rock's step in the report; do not try to publish.
