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
