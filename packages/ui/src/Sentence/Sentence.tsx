'use client';

import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { TermText } from '../TermText/TermText.js';
import type { Segment, Support } from '../Term/Term.js';

export type { Term, Segment, Support } from '../Term/Term.js';

export type SentenceProps = Omit<ComponentProps<'section'>, 'children' | 'onToggle'> & {
  /** The sentence in reading order: plain strings and markable terms. */
  segments: readonly Segment[];
  /** The neighbours, dimmed above and below. */
  previous?: string;
  next?: string;
  /** Caps labels over the neighbours, e.g. "eelmine lause" and "järgmine lause", so a reader
   * knows what the dim lines are. The app passes them in its own language; without them the
   * neighbours render bare. */
  previousLabel?: string;
  nextLabel?: string;
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

/** The reading unit: one sentence at reading size, its neighbours dimmed, its terms openable. */
export function Sentence({
  segments,
  previous,
  next,
  previousLabel,
  nextLabel,
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
  return (
    <section
      aria-label={label}
      data-support={support}
      data-state={peeking ? 'peeking' : 'idle'}
      className={clsx('flex max-w-[1020px] flex-col gap-24 overflow-x-clip font-content', className)}
      {...rest}
    >
      {previous ? (
        <div className="flex flex-col gap-4">
          {previousLabel ? <span className="font-chrome text-label uppercase tracking-caps text-dim">{previousLabel}</span> : null}
          <p className="text-title font-normal text-dim">{previous}</p>
        </div>
      ) : null}
      <p lang="et" className="text-reading-narrow sm:text-reading text-ink">
        <TermText segments={segments} size="reading" support={support} pinned={pinned} counts={counts} notes={notes} peeking={peeking} onToggle={onToggle} />
      </p>
      {support === 'korvuti' && english ? (
        <div lang="en" className="flex flex-col gap-4 font-chrome">
          <p className="text-body text-dim">{english.text}</p>
          <p className="text-label text-dim">{english.note}</p>
        </div>
      ) : null}
      {next ? (
        <div className="flex flex-col gap-4">
          {nextLabel ? <span className="font-chrome text-label uppercase tracking-caps text-dim">{nextLabel}</span> : null}
          <p className="text-title font-normal text-dim">{next}</p>
        </div>
      ) : null}
    </section>
  );
}
