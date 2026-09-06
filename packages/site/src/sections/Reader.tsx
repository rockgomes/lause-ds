import { useEffect, useState } from 'react';
import { Button, Dial, Keycap, Progress, Sentence, usePeek, type Support } from 'lause-ds';
import { useMediaQuery } from '../media.js';
import { sentenceEnglish, sentenceNext, sentencePrevious, sentenceSegments, supportOptions } from '../data/reader-sample.js';

export type ReaderProps = {
  /**
   * Overrides the `(hover: none)` media query so tests can render the touch variant without a
   * real touch-only browser — the section otherwise reads it itself.
   */
  touch?: boolean;
};

/** The reading unit, live: pin a term, peek every gloss, and dial how much support the sentence carries. */
export function Reader({ touch }: ReaderProps) {
  const hoverNone = useMediaQuery('(hover: none)');
  const isTouch = touch ?? hoverNone;

  const [support, setSupport] = useState<Support>('tugi');
  const [pinned, setPinned] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  // The latch: held ⌥ sets it on a keyboard, the touch Button toggles it directly. Either way
  // `usePeek` folds it into `peeking` the same way.
  const [latched, setLatched] = useState(false);
  const { peeking, held } = usePeek({ latched, enabled: true });

  const onToggle = (id: string) => {
    if (pinned.includes(id)) setPinned(pinned.filter((p) => p !== id));
    else {
      setPinned([...pinned, id]);
      setCounts({ ...counts, [id]: (counts[id] ?? 0) + 1 });
    }
  };

  // Esc clears every pin — the Keycap row below promises it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPinned([]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-32">
      <h2 id="reader-title" className="break-words font-content text-headline-narrow sm:text-headline">
        Reader
      </h2>
      <p className="max-w-[640px] text-body text-dim">
        {isTouch
          ? 'Tap a term to pin its gloss. The button shows every gloss at once — the same latch the ⌥ key sets on a keyboard.'
          : 'The reading unit, live. Click a term to pin its gloss; hold ⌥ to see every gloss at once; the dial sets how much support the sentence carries.'}
      </p>
      <Dial label="Support level" value={support} onChange={setSupport} options={supportOptions} />
      <Sentence
        segments={sentenceSegments}
        previous={sentencePrevious}
        next={sentenceNext}
        support={support}
        pinned={pinned}
        counts={counts}
        peeking={peeking}
        english={sentenceEnglish}
        onToggle={onToggle}
        label="Lause 5 / 8"
      />
      {isTouch ? (
        <div className="flex items-center gap-16">
          <Button variant="outline" aria-pressed={latched} onClick={() => setLatched((l) => !l)}>
            Show all glosses
          </Button>
          <span className="text-label text-dim">tap · pin</span>
        </div>
      ) : (
        <p className="flex flex-wrap items-center gap-16 text-label text-dim">
          <span className="flex items-center gap-8">
            <Keycap held={held}>⌥</Keycap> peek
          </span>
          <span className="flex items-center gap-8">
            <Keycap>↵</Keycap> pin
          </span>
          <span className="flex items-center gap-8">
            <Keycap>Esc</Keycap> clear
          </span>
        </p>
      )}
      <Progress total={8} current={4} label="Lause 5 / 8" />
    </div>
  );
}
