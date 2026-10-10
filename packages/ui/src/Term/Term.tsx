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
