'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useRef, useState, type ComponentProps } from 'react';
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

export type SentenceProps = Omit<ComponentProps<'section'>, 'children' | 'onToggle'> & {
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
  /**
   * While true every gloss shows, pinned or not.
   * Announces nothing; the glosses are already in the accessibility tree and the app decides whether to announce the mode.
   */
  peeking?: boolean;
  /**
   * The Riigi Teataja English and the fixed unofficial-translation line, shown under the sentence
   * in korvuti; the note is never optional because the text is an unofficial translation of
   * constitutional law.
   */
  english?: { text: string; note: string };
  /** Called with the term id when a term is clicked or opened with Enter/Space. */
  onToggle: (termId: string) => void;
  /** Accessible name of the reading region, e.g. "Lause 5 / 8". */
  label: string;
};

const isTerm = (s: Segment): s is Term => typeof s !== 'string';

/** The reading unit: one sentence at reading size, its neighbours dimmed, its terms openable. */
export function Sentence({
  segments,
  previous,
  next,
  support,
  pinned,
  counts = {},
  notes = {},
  peeking = false,
  english,
  onToggle,
  label,
  className,
  ...rest
}: SentenceProps) {
  const base = useId();
  const marked = support !== 'et';
  const prevPinnedRef = useRef(pinned);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const prev = prevPinnedRef.current;
    const newlyPinned = pinned.filter((id) => !prev.includes(id));
    if (newlyPinned.length > 0) {
      const glosses = newlyPinned
        .map((id) => segments.find((seg): seg is Term => isTerm(seg) && seg.id === id)?.gloss)
        .filter((gloss): gloss is string => gloss !== undefined);
      setAnnouncement(glosses.join(', '));
    }
    prevPinnedRef.current = pinned;
  }, [pinned]);

  return (
    <section
      aria-label={label}
      data-support={support}
      data-state={peeking ? 'peeking' : 'idle'}
      className={clsx('flex max-w-[1020px] flex-col gap-24 overflow-x-clip font-content', className)}
      {...rest}
    >
      {previous ? <p className="text-title font-normal text-dim">{previous}</p> : null}
      <p lang="et" className="text-reading-narrow sm:text-reading font-normal text-ink">
        {segments.map((seg, i) => {
          if (!isTerm(seg)) return <span key={i}>{seg}</span>;
          const isPinned = pinned.includes(seg.id);
          const shown = isPinned || peeking;
          const bubbleId = `${base}-${i}`;
          return (
            <span key={i} className="relative inline">
              <button
                type="button"
                aria-pressed={isPinned}
                aria-describedby={shown ? bubbleId : undefined}
                data-state={isPinned ? 'pinned' : 'idle'}
                data-peeked={shown ? 'true' : undefined}
                data-marked={marked}
                onClick={() => onToggle(seg.id)}
                className={clsx(
                  'inline cursor-pointer rounded-keycap font-content text-reading-narrow sm:text-reading font-normal text-ink',
                  focusRing,
                  hoverFade,
                  marked && 'underline decoration-accent decoration-(length:--lause-stroke-mark) underline-offset-(length:--lause-space-12) [text-decoration-skip-ink:none]',
                  marked && !isPinned && 'decoration-dotted',
                  isPinned && 'decoration-solid decoration-(length:--lause-stroke-pin)',
                  'hover:bg-ground-hover',
                )}
              >
                {seg.text}
              </button>
              {shown ? (
                <Bubble id={bubbleId} lang="en" count={counts[seg.id]} note={notes[seg.id]}>
                  {seg.gloss}
                </Bubble>
              ) : null}
            </span>
          );
        })}
      </p>
      {support === 'korvuti' && english ? (
        <div lang="en" className="flex flex-col gap-4 font-chrome">
          <p className="text-body text-dim">{english.text}</p>
          <p className="text-label text-dim">{english.note}</p>
        </div>
      ) : null}
      {next ? <p className="text-title font-normal text-dim">{next}</p> : null}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
