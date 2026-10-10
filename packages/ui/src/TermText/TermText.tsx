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
