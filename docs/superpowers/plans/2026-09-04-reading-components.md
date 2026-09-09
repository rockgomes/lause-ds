# Lause DS, Plan 3: The Reading Components

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The four components that carry the language layer (`Bubble`, `Sentence`, `Nav`, `Cell`) plus the headless `usePeek` hook that turns a held ⌥, a latch, and window blur into one `peeking` boolean, all on the token theme, each with stories that are axe-checked tests.

**Architecture:** Same package and harness as Plan 2 (`packages/ui`, one folder per component, stories run as vitest browser tests with axe as error, `Dark` story per component, shared class constants in `src/styles.ts`). The language-layer state (which words are pinned, the look-up tally, the dial level, the latch) belongs to the app; these components take it as props and report intent through callbacks. `usePeek` is the one piece of behaviour the system owns, because the spec fixes its rules (momentary, latchable, clears on blur, intercepts Alt).

**Tech Stack:** unchanged: React 19.2, Tailwind 4.3, Storybook 10.6, vitest 4.1 browser mode, culori in the token build.

**Spec:** `docs/specs/2026-09-03-lause-ds-design.md`, §4 rows Sentence, Bubble, Cell, Nav; §2 decisions 5, 6, 10. Behaviour: the trainer spec §7 "The reader and the language layer" (`docs/superpowers/specs/2026-09-01-estonian-citizenship-exam-trainer-design.md` in `rockgomes/estonian-citizenship-test`) and the design decisions §3–§4, §8 (`docs/design/2026-09-03-lause-design-decisions.md` there, branch `docs/lause-design-decisions`). The interaction prototype "Node Map & Language Layer" is the reference for pin, peek, latch and put-away.

**Fixed rules these components implement:**
- Dial levels: `et` no marks, peek and click still work; `tugi` terms marked with a dotted accent underline; `korvuti` as tugi plus the Riigi Teataja English under the sentence, always with the unofficial-translation line.
- Pin: click a term, its translation appears as a bubble above the word (ink fill, ground text, small tail); click again to put it away; several pins at once. Line height is `open` (1.85) so bubbles never cover the line above.
- Peek: while `peeking`, every translation on screen shows and the chrome swaps to English labels; it does not gain a subtitle. Release and everything returns. Peek clears on window blur. Every markable term is focusable and opens with Enter or Space. Alt is intercepted so it cannot move focus to the browser menu bar.
- Harvest: the app counts look-ups; the bubble shows the count and, at three, the app's promotion note.
- Nav: context left, caps nav centre (current in ink, rest dim), controls right; exam mode reduces it to the context and one action.
- Cell: the 2×2 drill; rows Igaüks / Eesti kodanik, columns Tohib piirata / Ei tohi piirata · § 130; keys 1–4.

**Proof:** stories, until the app exists (see Plan 2's note).

**Roadmap:** Plan 4 Figma library; Plan 5 MCP server; Plan 6 docs site and public Storybook.

## Global Constraints

- Node `24`, npm workspaces, TypeScript strict, ESM only. `'use client'` is the first line of every component file (not `index.ts`).
- Components use the token theme only (Tailwind utilities that resolve to `--lause-*`); the theme is closed. Raw px only for the rule values 44px (target), 640px (option width) and 1020px (reading measure). Stroke widths via `border-(length:--lause-stroke-*)`, `outline-(length:…)`, `decoration-(length:…)`.
- Every interactive element uses `focusRing`, `disabledControl` and `hitTarget` from `src/styles.ts`; disabled controls never hover; hover/pressed follow the Plan 2 rule with the `ink-hover`, `ink-active`, `ground-hover`, `surface-hover` tokens and `hoverFade`.
- Every story passes axe (`parameters.a11y.test = 'error'`); every component has a multi-state `Dark` story and `play` functions where it has behaviour; plays that focus something end with `restFocus()` from `src/test-utils.ts`.
- Component folders `packages/ui/src/<Name>/<Name>.tsx` + `<Name>.stories.tsx`; `src/index.ts` re-exports; imports use `.js` extensions. Accessible-name prop is `label`. Stateful roots carry `data-state`.
- No app copy baked into components: Estonian strings arrive through props (story args are Estonian). Docs, comments, story names in English.
- Generated outputs stay committed; CI's drift check stays green.
- Commit messages conventional, each ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File structure

```
tokens/src/scales.json                     + stroke.mark 3, stroke.pin 4, tracking.caps 0.1em
packages/tokens/src/scales.ts              + tracking group (em dimensions)
packages/ui/src/Bubble/Bubble.tsx          translation bubble above a word: text, count, note, tail
packages/ui/src/Sentence/Sentence.tsx      the reading unit: previous/next dimmed, terms, pins, peek, English under
packages/ui/src/usePeek/usePeek.ts         held ⌥ | latch | blur → peeking
packages/ui/src/usePeek/usePeek.stories.tsx  a demo component that shows the hook's state
packages/ui/src/Nav/Nav.tsx                top chrome: context, caps nav with English swap, controls
packages/ui/src/Cell/Cell.tsx              2×2 drill cell + CellGrid (a table with row/column headers)
packages/ui/src/index.ts                   + exports
.changeset/reading-components.md
```

---

### Task 1: Tokens the layer needs

**Files:**
- Modify: `tokens/src/scales.json`, `packages/tokens/src/scales.ts`, `packages/tokens/test/scales.test.ts`, `docs/specs/2026-09-03-lause-ds-design.md` (§3 primitives table)
- Generated: `tokens/primitives.tokens.json`, `packages/ui/src/tokens/tokens.css`, `figma/variables.json`

**Interfaces:**
- Produces: primitives `stroke.mark` (3px, the dotted mark underline), `stroke.pin` (4px, the solid pinned underline), `type.tracking.caps` (0.1em, caps labels). CSS: `--lause-stroke-mark`, `--lause-stroke-pin`, `--lause-type-tracking-caps`.

- [ ] **Step 1: Write the failing test**

Add to `packages/tokens/test/scales.test.ts` inside the existing `describe`:
```ts
  it('emits the mark and pin strokes and the caps tracking', () => {
    const f = flatten(buildScales(rules, colors));
    expect(f.get('stroke.mark')?.$value).toEqual({ value: 3, unit: 'px' });
    expect(f.get('stroke.pin')?.$value).toEqual({ value: 4, unit: 'px' });
    expect(f.get('type.tracking.caps')?.$value).toEqual({ value: 0.1, unit: 'em' });
  });
```
(`rules` and `colors` are whatever names the file already uses for the parsed `scales.json` and the `buildColors(...)` result; match them.)

Run: `npx vitest run packages/tokens/test/scales.test.ts`
Expected: FAIL on `stroke.mark` (undefined).

- [ ] **Step 2: Add the values**

`tokens/src/scales.json`: change `"stroke": { "thin": 1.5, "focus": 2 }` to `"stroke": { "thin": 1.5, "focus": 2, "mark": 3, "pin": 4 }` and add, after the `"leading"` line: `"tracking": { "caps": 0.1 },`.

`packages/tokens/src/scales.ts`: in `ScaleRules` add `tracking: Record<string, number>;` after `leading`. Next to the existing `px` helper add:
```ts
const em = (v: number): Token => ({ $type: 'dimension', $value: { value: v, unit: 'em' } });
```
(import `Token` from `./dtcg.js` if the file does not already). In `buildScales`, build `const tracking: Group = Object.fromEntries(Object.entries(rules.tracking).map(([k, v]) => [k, em(v)]));` and return `type: { size, leading, tracking }`.

- [ ] **Step 3: Run to verify it passes, regenerate, check the outputs**

Run: `npx vitest run packages/tokens/test/scales.test.ts`. Expected: all pass.
Run: `npm run build:tokens && npm test && npm run typecheck`
Check: `grep -n "stroke-mark\|stroke-pin\|tracking-caps" packages/ui/src/tokens/tokens.css` shows `--lause-stroke-mark: 3px;`, `--lause-stroke-pin: 4px;`, `--lause-type-tracking-caps: 0.1em;`. The emitters need no change: `raw()` prints `${value}${unit}` and Figma gets FLOAT values.

Spec §3 primitives table: change the `type.leading` row's neighbour by adding a row after it: `| \`type.tracking\` | Named letter-spacing | \`caps\` 0.1em |`, and change the `stroke` description if a row exists, else add `| \`stroke\` | Named widths | \`thin\` 1.5 · \`focus\` 2 · \`mark\` 3 · \`pin\` 4 |` after `radius`.

- [ ] **Step 4: Commit**

```bash
git add tokens packages/tokens packages/ui/src/tokens figma docs/specs
git commit -m "feat(tokens): mark and pin strokes, caps tracking

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Bubble

**Files:**
- Create: `packages/ui/src/Bubble/Bubble.tsx`, `packages/ui/src/Bubble/Bubble.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Produces: `Bubble({ children, count?, note?, size?, id?, className? })`: an absolutely positioned bubble that sits above whatever `position: relative` parent contains it, with a tail. `role="note"`. Sentence places it inside each term.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Bubble/Bubble.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Bubble } from './Bubble.js';

/** A word with a bubble above it, the way Sentence uses it. */
function Word({ children, bubble }: { children: string; bubble: React.ReactNode }) {
  return (
    <p className="mt-64 font-content text-reading">
      <span className="relative">
        {children}
        {bubble}
      </span>
    </p>
  );
}

const meta = {
  title: 'Bubble',
  component: Bubble,
  args: { children: 'to stand as a candidate', count: 1 },
  render: (args) => <Word bubble={<Bubble {...args} />}>kandideerida</Word>,
} satisfies Meta<typeof Bubble>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pinned: Story = {
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    await expect(note).toHaveTextContent('to stand as a candidate');
    await expect(note).toHaveTextContent('×1');
  },
};

export const Promoted: Story = { args: { children: 'with the right to vote', count: 3, note: '→ kordamisse' } };

export const NoCount: Story = { args: { count: undefined } };

export const Small: Story = { args: { size: 'sm', children: 'Reader' } };

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-col gap-32">
      <Word bubble={<Bubble count={1}>to stand as a candidate</Bubble>}>kandideerida</Word>
      <Word bubble={<Bubble count={3} note="→ kordamisse">with the right to vote</Bubble>}>hääleõiguslik</Word>
    </div>
  ),
};
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Bubble`. Expected: FAIL, cannot resolve `./Bubble.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Bubble/Bubble.tsx`:
```tsx
'use client';

import { clsx } from 'clsx';
import type { ComponentProps, ReactNode } from 'react';

export type BubbleProps = Omit<ComponentProps<'span'>, 'children'> & {
  /** The translation. */
  children: ReactNode;
  /** How many times this term has been looked up; shown as ×N in accent. */
  count?: number;
  /** A short note after the count, e.g. the app's promotion text. */
  note?: string;
  /** sm: the chrome-label size, for peeked nav items. md: the reading size. */
  size?: 'md' | 'sm';
};

/**
 * A translation bubble that sits above the word it belongs to. Render it inside an element with
 * `position: relative`; it centres itself over that element and draws a tail down to it.
 */
export function Bubble({ children, count, note, size = 'md', className, ...rest }: BubbleProps) {
  return (
    <span
      role="note"
      data-size={size}
      className={clsx(
        'pointer-events-none absolute bottom-full left-1/2 mb-8 -translate-x-1/2 whitespace-nowrap rounded-bubble bg-ink font-chrome italic text-on-ink',
        size === 'md' ? 'px-12 py-4 text-title font-normal' : 'px-8 py-2 text-label font-normal',
        // the tail
        "after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-ink after:content-['']",
        className,
      )}
      {...rest}
    >
      {children}
      {count !== undefined ? (
        <span className="ml-8 not-italic font-semibold text-label text-accent-on-ink">
          ×{count}
          {note ? ` ${note}` : null}
        </span>
      ) : null}
    </span>
  );
}
```

Note `after:border-8`: Tailwind's border-width utilities take a bare number in px and are not part of the closed namespaces; the 8px tail matches `space.8`. If the reviewer prefers, `after:border-(length:--lause-space-8)` is equivalent.

Add to `packages/ui/src/index.ts`:
```ts
export { Bubble, type BubbleProps } from './Bubble/Bubble.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Bubble`. Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Bubble packages/ui/src/index.ts
git commit -m "feat(ui): Bubble, translation above a word, with count and tail

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Sentence

**Files:**
- Create: `packages/ui/src/Sentence/Sentence.tsx`, `packages/ui/src/Sentence/Sentence.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `Bubble` (Task 2); `focusRing`, `hoverFade` from `src/styles.ts`.
- Produces:
  ```ts
  type Term = { id: string; text: string; gloss: string };
  type Segment = string | Term;                 // plain text or a markable term, in reading order
  type Support = 'et' | 'tugi' | 'korvuti';
  type SentenceProps = {
    segments: readonly Segment[];
    previous?: string; next?: string;            // dimmed neighbours
    support: Support;
    pinned: readonly string[];                    // term ids with a bubble shown
    counts?: Readonly<Record<string, number>>;   // look-up tally per term id
    notes?: Readonly<Record<string, string>>;    // per-term note for the bubble (e.g. promotion)
    peeking?: boolean;                            // every gloss shown, pinned or not
    english?: string;                             // the RT translation, shown under in korvuti
    englishNote?: string;                         // the fixed unofficial-translation line
    onToggle: (termId: string) => void;
    label: string;                                // accessible name of the region, e.g. "Lause 5 / 8"
    className?: string;
  };
  ```
  Each term renders as a `<button type="button" aria-pressed={pinned}>` with `data-state` `idle | pinned | peeked`; its bubble is `aria-describedby`-linked when shown.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Sentence/Sentence.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Sentence, type SentenceProps, type Segment } from './Sentence.js';
import { restFocus } from '../test-utils.js';

const segments: Segment[] = [
  'Riigikogusse võib ',
  { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate' },
  ' iga vähemalt kahekümne ühe aastane ',
  { id: 'haaleoiguslik', text: 'hääleõiguslik', gloss: 'with the right to vote' },
  ' Eesti ',
  { id: 'kodanik', text: 'kodanik', gloss: 'citizen' },
  '.',
];

function Controlled(props: SentenceProps) {
  const [pinned, setPinned] = useState<string[]>([...props.pinned]);
  const [counts, setCounts] = useState<Record<string, number>>({ ...props.counts });
  return (
    <Sentence
      {...props}
      pinned={pinned}
      counts={counts}
      onToggle={(id) => {
        props.onToggle(id);
        if (pinned.includes(id)) setPinned(pinned.filter((p) => p !== id));
        else {
          setPinned([...pinned, id]);
          setCounts({ ...counts, [id]: (counts[id] ?? 0) + 1 });
        }
      }}
    />
  );
}

const meta = {
  title: 'Sentence',
  component: Sentence,
  render: (args) => <Controlled {...args} />,
  args: {
    segments,
    previous: 'Riigikogu liikmed valitakse vabadel valimistel proportsionaalsuse põhimõtte alusel.',
    next: 'Riigikogu liikmete valimise korra sätestab Riigikogu valimise seadus.',
    support: 'tugi',
    pinned: [],
    counts: {},
    onToggle: fn(),
    label: 'Lause 5 / 8',
  },
} satisfies Meta<typeof Sentence>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tugi: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Lause 5 / 8' });
    const terms = within(region).getAllByRole('button');
    await expect(terms).toHaveLength(3);
    await expect(terms[0]).toHaveAttribute('data-state', 'idle');
    await expect(canvas.queryByRole('note')).toBeNull();

    await userEvent.click(terms[0]);
    await expect(args.onToggle).toHaveBeenLastCalledWith('kandideerida');
    await expect(terms[0]).toHaveAttribute('aria-pressed', 'true');
    await expect(terms[0]).toHaveAttribute('data-state', 'pinned');
    const note = canvas.getByRole('note');
    await expect(note).toHaveTextContent('to stand as a candidate');
    await expect(note).toHaveTextContent('×1');
    await expect(terms[0]).toHaveAttribute('aria-describedby', note.id);

    await userEvent.click(terms[0]);
    await expect(terms[0]).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.queryByRole('note')).toBeNull();
    restFocus();
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const terms = within(canvasElement).getAllByRole('button');
    terms[1].focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onToggle).toHaveBeenLastCalledWith('haaleoiguslik');
    await expect(terms[1]).toHaveAttribute('aria-pressed', 'true');
    restFocus();
  },
};

export const TwoPins: Story = {
  args: { pinned: ['kandideerida', 'haaleoiguslik'], counts: { kandideerida: 1, haaleoiguslik: 3 }, notes: { haaleoiguslik: '→ kordamisse' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('note')).toHaveLength(2);
  },
};

export const Peeking: Story = {
  args: { peeking: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('note')).toHaveLength(3);
    for (const t of canvas.getAllByRole('button')) await expect(t).toHaveAttribute('data-state', 'peeked');
  },
};

export const EestiKeeles: Story = {
  args: { support: 'et' },
  play: async ({ canvasElement }) => {
    const terms = within(canvasElement).getAllByRole('button');
    await expect(terms).toHaveLength(3);
    await expect(terms[0]).toHaveAttribute('data-marked', 'false');
  },
};

export const Korvuti: Story = {
  args: {
    support: 'korvuti',
    english: 'Every Estonian citizen who has the right to vote and has attained twenty-one years of age may stand as a candidate for the Riigikogu.',
    englishNote: 'mitteametlik tõlge · eestikeelne tekst on autoriteetne',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/mitteametlik tõlge/)).toBeVisible();
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { pinned: ['kandideerida'], counts: { kandideerida: 2 }, support: 'korvuti', english: 'Every Estonian citizen who has the right to vote and has attained twenty-one years of age may stand as a candidate for the Riigikogu.', englishNote: 'mitteametlik tõlge · eestikeelne tekst on autoriteetne' },
};
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Sentence`. Expected: FAIL, cannot resolve `./Sentence.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Sentence/Sentence.tsx`:
```tsx
'use client';

import { clsx } from 'clsx';
import { useId } from 'react';
import { Bubble } from '../Bubble/Bubble.js';
import { focusRing, hoverFade } from '../styles.js';

export type Term = { id: string; text: string; gloss: string };
export type Segment = string | Term;
export type Support = 'et' | 'tugi' | 'korvuti';

export type SentenceProps = {
  /** The sentence in reading order: plain strings and markable terms. */
  segments: readonly Segment[];
  /** The neighbours, dimmed above and below. */
  previous?: string;
  next?: string;
  /** The dial level. et: no marks, terms still open. tugi: marks. korvuti: marks and the English under. */
  support: Support;
  /** Term ids whose bubble is shown. */
  pinned: readonly string[];
  /** Look-up tally per term id, shown in the bubble. */
  counts?: Readonly<Record<string, number>>;
  /** Per-term note shown after the count, e.g. the promotion text at three look-ups. */
  notes?: Readonly<Record<string, string>>;
  /** While true every gloss shows, pinned or not. */
  peeking?: boolean;
  /** The Riigi Teataja English, shown under the sentence in korvuti. */
  english?: string;
  /** The fixed line under the English, e.g. the unofficial-translation note. */
  englishNote?: string;
  /** Called with the term id when a term is clicked or opened with Enter/Space. */
  onToggle: (termId: string) => void;
  /** Accessible name of the reading region, e.g. "Lause 5 / 8". */
  label: string;
  className?: string;
};

const isTerm = (s: Segment): s is Term => typeof s !== 'string';

/** The reading unit: one sentence at reading size, its neighbours dimmed, its terms openable. */
export function Sentence({ segments, previous, next, support, pinned, counts = {}, notes = {}, peeking = false, english, englishNote, onToggle, label, className }: SentenceProps) {
  const base = useId();
  const marked = support !== 'et';
  return (
    <section aria-label={label} data-support={support} className={clsx('flex max-w-[1020px] flex-col gap-24 font-content', className)}>
      {previous ? <p className="text-title font-normal text-dim">{previous}</p> : null}
      <p lang="et" className="text-reading font-normal text-ink">
        {segments.map((seg, i) => {
          if (!isTerm(seg)) return <span key={i}>{seg}</span>;
          const isPinned = pinned.includes(seg.id);
          const shown = isPinned || peeking;
          const state = peeking ? 'peeked' : isPinned ? 'pinned' : 'idle';
          const bubbleId = `${base}-${seg.id}`;
          return (
            <button
              key={seg.id}
              type="button"
              aria-pressed={isPinned}
              aria-describedby={shown ? bubbleId : undefined}
              data-state={state}
              data-marked={marked}
              onClick={() => onToggle(seg.id)}
              className={clsx(
                'relative inline cursor-pointer rounded-keycap font-content text-reading font-normal text-ink',
                focusRing,
                hoverFade,
                marked && 'underline decoration-accent decoration-(length:--lause-stroke-mark) underline-offset-(length:--lause-space-12)',
                marked && !isPinned && 'decoration-dotted',
                isPinned && 'decoration-solid decoration-(length:--lause-stroke-pin)',
                'hover:bg-ground-hover',
              )}
            >
              {seg.text}
              {shown ? (
                <Bubble id={bubbleId} count={counts[seg.id]} note={notes[seg.id]}>
                  {seg.gloss}
                </Bubble>
              ) : null}
            </button>
          );
        })}
      </p>
      {support === 'korvuti' && english ? (
        <div lang="en" className="flex flex-col gap-4 font-chrome">
          <p className="text-body text-dim">{english}</p>
          {englishNote ? <p className="text-label text-dim">{englishNote}</p> : null}
        </div>
      ) : null}
      {next ? <p className="text-title font-normal text-dim">{next}</p> : null}
    </section>
  );
}
```

Notes for the implementer: `text-reading` carries leading `open` (1.85) from the type role, which is what keeps bubbles off the line above. `decoration-dotted`/`decoration-solid` are static text-decoration utilities, not theme values. `underline-offset-(length:--lause-space-12)` is 12px, the nearest step to the frames' 10px.

Add to `packages/ui/src/index.ts`:
```ts
export { Sentence, type SentenceProps, type Segment, type Term, type Support } from './Sentence/Sentence.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Sentence`. Expected: 7 passed. If axe reports `nested-interactive` or `button-name` issues around the Bubble inside the button, move the bubble out of the button into a wrapping `<span className="relative inline">` that holds both the button and the bubble, keep `aria-describedby`, and re-run.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Sentence packages/ui/src/index.ts
git commit -m "feat(ui): Sentence, the reading unit with marks, pins and peek

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: usePeek

**Files:**
- Create: `packages/ui/src/usePeek/usePeek.ts`, `packages/ui/src/usePeek/usePeek.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Produces: `usePeek(options?: { latched?: boolean; key?: string }): { peeking: boolean; held: boolean }`: `held` is true while the modifier (default `'Alt'`) is physically down; `peeking = held || latched`; both clear on window `blur` and on `visibilitychange` to hidden; the modifier's keydown is `preventDefault`ed so it cannot move focus to the browser menu bar.

- [ ] **Step 1: Write the stories**

`packages/ui/src/usePeek/usePeek.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button.js';
import { Keycap } from '../Keycap/Keycap.js';
import { usePeek } from './usePeek.js';
import { restFocus } from '../test-utils.js';

/** Shows the hook's state and offers the latch, the way the reader's bottom bar does. */
function PeekDemo() {
  const [latched, setLatched] = useState(false);
  const { peeking, held } = usePeek({ latched });
  return (
    <div className="flex flex-col gap-16">
      <p className="text-body" data-testid="state" data-peeking={peeking} data-held={held}>
        {peeking ? 'Reader' : 'Lugeja'} <Keycap held={held}>⌥</Keycap>
      </p>
      <Button variant="outline" aria-pressed={latched} onClick={() => setLatched(!latched)}>
        Hoia inglise keeles
      </Button>
    </div>
  );
}

const meta = { title: 'usePeek', component: PeekDemo } satisfies Meta<typeof PeekDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HoldAlt: Story = {
  play: async ({ canvasElement }) => {
    const state = within(canvasElement).getByTestId('state');
    await expect(state).toHaveAttribute('data-peeking', 'false');
    await userEvent.keyboard('{Alt>}');
    await expect(state).toHaveAttribute('data-peeking', 'true');
    await expect(state).toHaveAttribute('data-held', 'true');
    await expect(state).toHaveTextContent('Reader');
    await userEvent.keyboard('{/Alt}');
    await expect(state).toHaveAttribute('data-peeking', 'false');
    await expect(state).toHaveTextContent('Lugeja');
  },
};

export const Latch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const state = canvas.getByTestId('state');
    const latch = canvas.getByRole('button', { name: 'Hoia inglise keeles' });
    await userEvent.click(latch);
    await expect(latch).toHaveAttribute('aria-pressed', 'true');
    await expect(state).toHaveAttribute('data-peeking', 'true');
    await expect(state).toHaveAttribute('data-held', 'false');
    await userEvent.click(latch);
    await expect(state).toHaveAttribute('data-peeking', 'false');
    restFocus();
  },
};

export const ClearsOnBlur: Story = {
  play: async ({ canvasElement }) => {
    const state = within(canvasElement).getByTestId('state');
    await userEvent.keyboard('{Alt>}');
    await expect(state).toHaveAttribute('data-peeking', 'true');
    window.dispatchEvent(new Event('blur'));
    await expect(state).toHaveAttribute('data-peeking', 'false');
    await userEvent.keyboard('{/Alt}');
  },
};

export const Dark: Story = { globals: { theme: 'dark' } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/usePeek`. Expected: FAIL, cannot resolve `./usePeek.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/usePeek/usePeek.ts`:
```ts
'use client';

import { useEffect, useState } from 'react';

export type UsePeekOptions = {
  /** The latch: holds the peek on without the key. */
  latched?: boolean;
  /** The modifier that peeks while held. */
  key?: string;
};

export type PeekState = {
  /** Every translation should show and the chrome should read English. */
  peeking: boolean;
  /** The modifier is physically down right now. */
  held: boolean;
};

/**
 * The peek gesture: hold the modifier and every translation shows; release and it goes.
 * A latch holds the same state without the key. Both clear when the window loses focus,
 * so the peek can never stick on. The modifier's keydown is cancelled so it cannot move
 * focus to the browser's menu bar.
 */
export function usePeek({ latched = false, key = 'Alt' }: UsePeekOptions = {}): PeekState {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key !== key) return;
      e.preventDefault();
      setHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === key) setHeld(false);
    };
    const clear = () => setHeld(false);
    const hidden = () => {
      if (document.visibilityState === 'hidden') setHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [key]);

  return { peeking: held || latched, held };
}
```

Add to `packages/ui/src/index.ts`:
```ts
export { usePeek, type UsePeekOptions, type PeekState } from './usePeek/usePeek.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/usePeek`. Expected: 4 passed. If `userEvent.keyboard('{Alt>}')` does not reach a `window` listener in the runner, dispatch `new KeyboardEvent('keydown', { key: 'Alt', bubbles: true })` on `window` in the play instead and note it in the report.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/usePeek packages/ui/src/index.ts
git commit -m "feat(ui): usePeek, held modifier, latch, and blur clearing as one boolean

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Nav

**Files:**
- Create: `packages/ui/src/Nav/Nav.tsx`, `packages/ui/src/Nav/Nav.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `Keycap`, `Dial` (in stories), `focusRing`, `hoverFade`.
- Produces:
  ```ts
  type NavItem = { id: string; label: string; labelEn: string; href: string; count?: number };
  type NavProps = Omit<ComponentProps<'header'>, 'children'> & {
    context: ReactNode;          // top-left, e.g. "§ 60 · lause 5 / 8"
    items: readonly NavItem[];   // centre; empty in exam mode
    current?: string;            // id of the current item → aria-current="page"
    peeking?: boolean;           // swap labels to labelEn
    controls?: ReactNode;        // top-right: the dial, the ⌥ hint, or the exam's one action
    label: string;               // accessible name of the <nav>
    onNavigate?: (id: string) => void;  // called before the link navigates (apps with client routing)
  };
  ```

- [ ] **Step 1: Write the stories**

`packages/ui/src/Nav/Nav.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button.js';
import { Dial } from '../Dial/Dial.js';
import { Keycap } from '../Keycap/Keycap.js';
import { Nav, type NavItem } from './Nav.js';
import { restFocus } from '../test-utils.js';

const items: NavItem[] = [
  { id: 'lugeja', label: 'Lugeja', labelEn: 'Reader', href: '#lugeja' },
  { id: 'skeemid', label: 'Skeemid', labelEn: 'Diagrams', href: '#skeemid' },
  { id: 'kordamine', label: 'Kordamine', labelEn: 'Review', href: '#kordamine', count: 14 },
  { id: 'eksam', label: 'Eksam', labelEn: 'Exam', href: '#eksam' },
];

const controls = (
  <>
    <Dial label="Tugi" value="tugi" onChange={() => {}} options={[{ value: 'et', label: 'Eesti keeles' }, { value: 'tugi', label: 'Tugi' }, { value: 'korvuti', label: 'Kõrvuti' }]} />
    <span className="flex items-center gap-8 text-label text-dim">
      <Keycap>⌥</Keycap> piilu
    </span>
  </>
);

const meta = {
  title: 'Nav',
  component: Nav,
  args: { context: '§ 60 · lause 5 / 8', items, current: 'lugeja', controls, label: 'Peamenüü', onNavigate: fn() },
} satisfies Meta<typeof Nav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Reader: Story = {
  play: async ({ canvasElement, args }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Peamenüü' });
    const links = within(nav).getAllByRole('link');
    await expect(links).toHaveLength(4);
    await expect(links[0]).toHaveAttribute('aria-current', 'page');
    await expect(links[2]).toHaveTextContent('Kordamine');
    await expect(links[2]).toHaveTextContent('14');
    await userEvent.click(links[1]);
    await expect(args.onNavigate).toHaveBeenLastCalledWith('skeemid');
    restFocus();
  },
};

export const Peeking: Story = {
  args: { peeking: true },
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole('link');
    await expect(links[0]).toHaveTextContent('Reader');
    await expect(links[0]).not.toHaveTextContent('Lugeja');
    await expect(links[2]).toHaveTextContent('Review');
  },
};

export const Exam: Story = {
  args: { context: 'Eksam · küsimus 12 / 24', items: [], current: undefined, controls: <Button variant="dim">Katkesta eksam</Button> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('link')).toBeNull();
  },
};

export const Dark: Story = { globals: { theme: 'dark' }, args: { peeking: true } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Nav`. Expected: FAIL, cannot resolve `./Nav.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Nav/Nav.tsx`:
```tsx
'use client';

import { clsx } from 'clsx';
import type { ComponentProps, ReactNode } from 'react';
import { focusRing, hoverFade } from '../styles.js';

export type NavItem = {
  id: string;
  /** The Estonian label, shown normally. */
  label: string;
  /** The English label, shown while peeking. */
  labelEn: string;
  href: string;
  /** A count after the label, e.g. cards due. */
  count?: number;
};

export type NavProps = Omit<ComponentProps<'header'>, 'children'> & {
  /** Top-left: where the learner is, e.g. "§ 60 · lause 5 / 8". */
  context: ReactNode;
  /** The centre items. Empty in exam mode. */
  items: readonly NavItem[];
  /** The current item's id. */
  current?: string;
  /** While true the items read their English labels. The chrome swaps; it never gains a subtitle. */
  peeking?: boolean;
  /** Top-right: the dial and the peek hint, or the exam's one action. */
  controls?: ReactNode;
  /** Accessible name of the navigation. */
  label: string;
  /** Called with the item id on click, before the link navigates. */
  onNavigate?: (id: string) => void;
};

/** The top chrome: context left, caps navigation centre, controls right. */
export function Nav({ context, items, current, peeking = false, controls, label, onNavigate, className, ...rest }: NavProps) {
  return (
    <header
      data-state={peeking ? 'peeking' : 'idle'}
      className={clsx('grid min-h-[44px] grid-cols-[1fr_auto_1fr] items-center gap-24 font-chrome text-label text-ink', className)}
      {...rest}
    >
      <div className="justify-self-start">{context}</div>
      <nav aria-label={label} className="justify-self-center">
        {items.length > 0 ? (
          <ul className="flex items-center gap-24 uppercase tracking-(--lause-type-tracking-caps)">
            {items.map((item) => {
              const isCurrent = item.id === current;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={isCurrent ? 'page' : undefined}
                    data-state={isCurrent ? 'current' : 'idle'}
                    onClick={() => onNavigate?.(item.id)}
                    className={clsx(
                      'inline-flex min-h-[44px] items-center gap-8 rounded-control px-8',
                      focusRing,
                      hoverFade,
                      isCurrent ? 'text-ink' : 'text-dim hover:text-ink',
                    )}
                  >
                    {peeking ? item.labelEn : item.label}
                    {item.count !== undefined ? <span className="normal-case tracking-normal">{item.count}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </nav>
      <div className="flex items-center gap-24 justify-self-end">{controls}</div>
    </header>
  );
}
```

Note: `tracking-normal` is Tailwind's static zero; `--tracking-*` is not among the closed namespaces, which is fine: the token is used for the caps value and the reset is the only static one.

Add to `packages/ui/src/index.ts`:
```ts
export { Nav, type NavProps, type NavItem } from './Nav/Nav.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Nav`. Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Nav packages/ui/src/index.ts
git commit -m "feat(ui): Nav, context, caps navigation that swaps to English on peek, controls

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Cell and CellGrid

**Files:**
- Create: `packages/ui/src/Cell/Cell.tsx`, `packages/ui/src/Cell/Cell.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `Keycap`, `focusRing`, `disabledControl`, `hoverFade`.
- Produces: `Cell(props)`: `ComponentProps<'button'> & { title: string; subtitle?: string; keycap?: string; state?: 'idle' | 'selected' | 'filled' | 'dimmed' }`; `CellGrid({ rows: readonly [string, string], columns: readonly [string, string], label, children })`: a `<table>` with row and column headers and four cells, in reading order row by row.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Cell/Cell.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Cell, CellGrid } from './Cell.js';
import { restFocus } from '../test-utils.js';

const meta = {
  title: 'Cell',
  component: Cell,
  args: { title: 'Igaüks', subtitle: 'tohib piirata', keycap: '1', onClick: fn() },
} satisfies Meta<typeof Cell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  play: async ({ canvasElement, args }) => {
    const cell = within(canvasElement).getByRole('button', { name: /Igaüks/ });
    await expect(cell).toHaveAttribute('data-state', 'idle');
    await userEvent.click(cell);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    restFocus();
  },
};

export const Selected: Story = { args: { state: 'selected', subtitle: 'ei tohi piirata', keycap: '2' } };
export const Filled: Story = { args: { state: 'filled' } };
export const Dimmed: Story = { args: { state: 'dimmed' } };

export const Grid: Story = {
  render: (args) => (
    <CellGrid rows={['Igaüks', 'Eesti kodanik']} columns={['Tohib piirata', 'Ei tohi piirata · § 130']} label="Õigused">
      <Cell {...args} title="Igaüks" subtitle="tohib piirata" keycap="1" />
      <Cell {...args} title="Igaüks" subtitle="ei tohi piirata" keycap="2" state="selected" />
      <Cell {...args} title="Eesti kodanik" subtitle="tohib piirata" keycap="3" />
      <Cell {...args} title="Eesti kodanik" subtitle="ei tohi piirata" keycap="4" />
    </CellGrid>
  ),
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole('table', { name: 'Õigused' });
    await expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    await expect(within(table).getAllByRole('rowheader')).toHaveLength(2);
    await expect(within(table).getAllByRole('button')).toHaveLength(4);
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <CellGrid rows={['Igaüks', 'Eesti kodanik']} columns={['Tohib piirata', 'Ei tohi piirata · § 130']} label="Õigused">
      <Cell {...args} title="Igaüks" subtitle="tohib piirata" keycap="1" />
      <Cell {...args} title="Igaüks" subtitle="ei tohi piirata" keycap="2" state="selected" />
      <Cell {...args} title="Eesti kodanik" subtitle="tohib piirata" keycap="3" state="filled" />
      <Cell {...args} title="Eesti kodanik" subtitle="ei tohi piirata" keycap="4" state="dimmed" />
    </CellGrid>
  ),
};
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Cell`. Expected: FAIL, cannot resolve `./Cell.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Cell/Cell.tsx`:
```tsx
'use client';

import { clsx } from 'clsx';
import { Children, type ComponentProps, type ReactNode } from 'react';
import { Keycap } from '../Keycap/Keycap.js';
import { disabledControl, focusRing, hoverFade } from '../styles.js';

export type CellState = 'idle' | 'selected' | 'filled' | 'dimmed';

export type CellProps = Omit<ComponentProps<'button'>, 'children'> & {
  /** The row's subject, e.g. "Igaüks". */
  title: string;
  /** The column's verdict, e.g. "tohib piirata". */
  subtitle?: string;
  /** The number key that picks this cell. */
  keycap?: string;
  state?: CellState;
};

const states: Record<CellState, string> = {
  idle: 'bg-surface text-ink shadow-tile enabled:hover:bg-surface-hover enabled:active:bg-surface-hover enabled:active:shadow-none',
  selected: 'bg-surface text-ink shadow-tile ring-(length:--lause-stroke-focus) ring-accent enabled:hover:bg-surface-hover',
  filled: 'bg-ink text-on-ink enabled:hover:bg-ink-hover enabled:active:bg-ink-active',
  dimmed: 'bg-surface text-dim shadow-tile enabled:hover:bg-surface-hover',
};

/** One cell of the 2×2 drill: the subject, the verdict, and its key. */
export function Cell({ title, subtitle, keycap, state = 'idle', className, type = 'button', ...rest }: CellProps) {
  return (
    <button
      type={type}
      data-state={state}
      aria-pressed={state === 'selected'}
      className={clsx(
        'flex min-h-[44px] w-full flex-col justify-between gap-16 rounded-card px-24 py-16 text-left font-chrome',
        focusRing,
        disabledControl,
        hoverFade,
        states[state],
        className,
      )}
      {...rest}
    >
      <span className="flex w-full items-center justify-between gap-16">
        <span className="font-content text-title font-normal">{title}</span>
        {keycap ? <Keycap aria-hidden="true">{keycap}</Keycap> : null}
      </span>
      {subtitle ? <span className={clsx('text-label', state === 'filled' ? 'text-on-ink' : 'text-dim')}>{subtitle}</span> : null}
    </button>
  );
}

export type CellGridProps = {
  /** The two row headers, top to bottom. */
  rows: readonly [string, string];
  /** The two column headers, left to right. */
  columns: readonly [string, string];
  /** Accessible name of the table. */
  label: string;
  /** Exactly four cells, in reading order: row 1 left, row 1 right, row 2 left, row 2 right. */
  children: ReactNode;
  className?: string;
};

/** The 2×2 drill laid out as a table, so the headers are read with each cell. */
export function CellGrid({ rows, columns, label, children, className }: CellGridProps) {
  const cells = Children.toArray(children);
  return (
    <table aria-label={label} className={clsx('w-full max-w-[640px] border-separate border-spacing-12 font-chrome', className)}>
      <thead>
        <tr>
          <td />
          {columns.map((c) => (
            <th key={c} scope="col" className="text-label uppercase tracking-(--lause-type-tracking-caps) text-dim">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r}>
            <th scope="row" className="text-left text-label uppercase tracking-(--lause-type-tracking-caps) text-dim">
              {r}
            </th>
            <td>{cells[i * 2]}</td>
            <td>{cells[i * 2 + 1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Note: `border-spacing-12` resolves to `--spacing-12` (12px) under the closed theme.

Add to `packages/ui/src/index.ts`:
```ts
export { Cell, CellGrid, type CellProps, type CellState, type CellGridProps } from './Cell/Cell.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Cell`. Expected: 6 passed.
Run: `npm test && npm run typecheck && npm run build:ui`. Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Cell packages/ui/src/index.ts
git commit -m "feat(ui): Cell and CellGrid, the 2×2 drill as a table

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Changeset, docs, pull request

**Files:**
- Create: `.changeset/reading-components.md`
- Modify: `README.md`, `packages/ui/README.md`

- [ ] **Step 1: Changeset**

`.changeset/reading-components.md`:
```md
---
"lause-ds": minor
---

The reading components: Bubble, Sentence, Nav, Cell + CellGrid, and the usePeek hook (held modifier, latch, blur clearing). Mark and pin stroke tokens; caps tracking token.
```

- [ ] **Step 2: Docs**

Root `README.md` `## Status`: replace with `Foundation and ten components done: Keycap, Button, Progress, Bar, Dial, Tile, Bubble, Sentence, Nav, Cell, plus the usePeek hook. Every story is a test with an axe check. Figma library next (Plan 4).`

`packages/ui/README.md` `## Components`: add one line each for `Bubble`, `Sentence`, `Nav`, `Cell` + `CellGrid`, `usePeek`.

- [ ] **Step 3: Run everything, commit, push, open the pull request**

Run: `npm test && npm run typecheck && npm run build:ui && npx changeset status`

```bash
git add .changeset README.md packages/ui/README.md
git commit -m "docs: the reading components and the peek hook

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin feat/reading-components
gh pr create --base main --head feat/reading-components --title "feat: the reading components: Sentence, Bubble, Nav, Cell, usePeek" --body "Plan 3 of the Lause design system.

- Bubble: translation above a word, with the look-up count and the promotion note
- Sentence: the reading unit: neighbours dimmed, terms as focusable buttons, dotted marks in tugi, solid pins with bubbles, every gloss while peeking, the English under in kõrvuti
- usePeek: held ⌥ or a latch → peeking; clears on blur; intercepts Alt
- Nav: context, caps navigation that swaps to English on peek, controls; exam mode
- Cell + CellGrid: the 2×2 drill as a table with row and column headers
- tokens: stroke.mark, stroke.pin, type.tracking.caps

Spec: docs/specs/2026-09-03-lause-ds-design.md · Plan: docs/superpowers/plans/2026-09-04-reading-components.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 4: Confirm CI**

Run: `gh pr checks --watch --interval 15`. Expected: `test` passes.

---

## Self-review

**Spec coverage.** §4 rows: Sentence (T3), Bubble (T2), Cell (T6), Nav (T5). Trainer spec §7: dial levels (T3 `support`), peek momentary + latch + blur + Alt intercept (T4), terms focusable and openable with Enter/Space (T3, native button), chrome swap to English (T5), harvest count shown (T2/T3 via `counts`/`notes`; the counting is the app's). Decision 6: `Dark` story per component. Decision 10: axe on every story.

**Placeholders.** None. Two conditional instructions with the action spelled out (nested-interactive fallback in T3; keyboard-event fallback in T4).

**Type consistency.** `Bubble` props (`children`, `count`, `note`, `size`, `id`) as used by `Sentence`. `focusRing`, `hoverFade`, `disabledControl` exist in `src/styles.ts` (Plan 2). `restFocus`/`tokenRgb` exist in `src/test-utils.ts`. `Segment`/`Term`/`Support` exported from Sentence and imported by its story. `NavItem` exported and used by the Nav story. `Keycap` accepts `held` and `aria-hidden`. Tokens `--lause-stroke-mark`, `--lause-stroke-pin`, `--lause-type-tracking-caps`, `--lause-space-12`, `rounded-bubble`, `rounded-card`, `rounded-keycap`, `accent-on-ink`, `ground-hover`, `surface-hover`, `ink-hover`, `ink-active` all exist after Task 1.
