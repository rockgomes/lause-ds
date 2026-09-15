import { Fragment, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Bubble, Button, focusRing, hitTarget, hoverFade, usePeek } from 'lause-ds';

type Word = { text: string; term?: { id: string; gloss: string } };

// The sentence from the Sentence story (packages/ui/src/Sentence/Sentence.stories.tsx),
// split into words. The three terms carry the same id/gloss as that story's segments.
const WORDS: Word[] = [
  { text: 'Riigikogusse' },
  { text: 'võib' },
  { text: 'kandideerida', term: { id: 'kandideerida', gloss: 'to stand as a candidate' } },
  { text: 'iga' },
  { text: 'vähemalt' },
  { text: 'kahekümne' },
  { text: 'ühe' },
  { text: 'aastane' },
  { text: 'hääleõiguslik', term: { id: 'haaleoiguslik', gloss: 'with the right to vote' } },
  { text: 'Eesti' },
  { text: 'kodanik.', term: { id: 'kodanik', gloss: 'citizen' } },
];

const PROMISE =
  'One sentence at a time. A design system for a citizenship-exam trainer: tokens as data, a Figma library bound to them, a coded library, and an MCP server so AI tools build screens that follow it.';

const STEP_MS = 60;
const PEEK_MS = 900;

// Button has no `href` (ButtonProps = ComponentProps<'button'> & { variant?, keycap? }), so the
// Storybook link is a plain <a> styled to match Button's outline variant
// (packages/ui/src/Button/Button.tsx), with the `enabled:` variants dropped: `:enabled` never
// matches an anchor.
const storybookLinkClasses = clsx(
  'inline-flex items-center justify-center gap-8 rounded-control px-24 font-chrome text-body font-semibold',
  hitTarget,
  focusRing,
  hoverFade,
  'border-(length:--lause-stroke-thin) border-ink text-ink hover:bg-ground-hover active:bg-ground-hover',
);

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
}

function focusAskInput() {
  const ask = document.getElementById('ask');
  // In Component/Check mode the panel has a real input/textarea to focus; in Tokens mode there is
  // no input row at all, so the next best target is the "Question" Dial's selected radio button.
  // Two separate queries, not one selector list: `querySelector` returns whichever match comes
  // first in DOM order, and the Dial's radios sit above the form, a combined selector would
  // always find the radio first, even when a real input/textarea is on the page.
  const target = ask?.querySelector<HTMLElement>('textarea, input') ?? ask?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
  (target ?? ask)?.focus();
}

export type HeroProps = {
  /** Defaults to the `(prefers-reduced-motion: reduce)` media query. */
  reducedMotion?: boolean;
};

/**
 * The story's opening sentence, assembling word by word, then peeking its three glosses once.
 * After that the terms work as in the Reader: click one to pin its gloss, hold ⌥ to see all three.
 */
export function Hero({ reducedMotion }: HeroProps) {
  const reduced = reducedMotion ?? prefersReducedMotion();
  const [revealed, setRevealed] = useState(reduced ? WORDS.length : 0);
  const [peeking, setPeeking] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  // The same hook the Reader uses: `held` is true while ⌥ is down.
  const { held } = usePeek({ enabled: true });
  const toggle = (id: string) =>
    setPinned((current) => (current.includes(id) ? current.filter((p) => p !== id) : [...current, id]));

  useEffect(() => {
    if (reduced) {
      setRevealed(WORDS.length);
      setPeeking(false);
      return;
    }
    setRevealed(0);
    setPeeking(false);
    let cancelled = false;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    let last = 0;
    // One word per animation frame at most, and only once STEP_MS has passed since the previous
    // one. Pre-scheduled timers do not work here: the page's first render blocks the main thread
    // for a few hundred ms right after mount, every due timer then fires in one burst, and eight
    // words appear at once (measured on the deploy preview). A frame-driven loop can never reveal
    // more than one word per frame, however long the thread was blocked.
    const tick = (now: number) => {
      if (cancelled) return;
      if (count === 0 || now - last >= STEP_MS) {
        count += 1;
        last = now;
        setRevealed(count);
      }
      if (count < WORDS.length) {
        frame = requestAnimationFrame(tick);
        return;
      }
      timer = setTimeout(() => {
        if (cancelled || isTouchDevice()) return;
        setPeeking(true);
        timer = setTimeout(() => {
          if (!cancelled) setPeeking(false);
        }, PEEK_MS);
      }, STEP_MS);
    };
    // Two frames in, so the page paints once before the first word moves.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [reduced]);

  return (
    <div className="flex flex-col items-start gap-32">
      <p lang="et" className="w-full break-words font-content text-headline-narrow text-ink hyphens-auto sm:text-headline">
        {WORDS.map((word, i) => {
          const isPinned = word.term ? pinned.includes(word.term.id) : false;
          const shown = Boolean(word.term) && (peeking || held || isPinned);
          const bubbleId = word.term ? `hero-gloss-${word.term.id}` : undefined;
          return (
            <Fragment key={i}>
              <span
                data-word
                data-state={reduced || i < revealed ? 'in' : 'pending'}
                // max-w-full: without it an `inline-block` box sizes to its own text regardless of
                // the container, so `break-words`/`hyphens-auto` on the <p> never gets a chance to
                // apply to a long unbreakable word (measured directly: "hääleõiguslik" alone runs to
                // ~320px at the phone's 48px headline size, wider than the 272px column at 320px).
                className="relative inline-block max-w-full"
              >
                {word.term ? (
                  // The Sentence component's term button, at headline size (packages/ui/src/Sentence/Sentence.tsx).
                  // max-w-full here too: the button is its own box, so it does not inherit the
                  // span's width constraint. Without it, the button sizes to its unbroken word
                  // (330px for "hääleõiguslik" at the bold 700 headline-narrow weight) and pushes
                  // past the 320px viewport instead of wrapping onto a second line.
                  <button
                    type="button"
                    aria-pressed={isPinned}
                    aria-describedby={shown ? bubbleId : undefined}
                    data-state={isPinned ? 'pinned' : 'idle'}
                    onClick={() => toggle(word.term!.id)}
                    className={clsx(
                      'inline max-w-full cursor-pointer rounded-keycap font-content text-headline-narrow sm:text-headline text-ink',
                      focusRing,
                      hoverFade,
                      'underline decoration-accent decoration-(length:--lause-stroke-mark) underline-offset-(length:--lause-space-4) [text-decoration-skip-ink:none]',
                      !isPinned && 'decoration-dotted',
                      isPinned && 'decoration-solid decoration-(length:--lause-stroke-pin)',
                      'hover:bg-ground-hover',
                    )}
                  >
                    {word.text}
                  </button>
                ) : (
                  word.text
                )}
                {word.term && shown ? (
                  <Bubble id={bubbleId} lang="en">
                    {word.term.gloss}
                  </Bubble>
                ) : null}
              </span>
              {i < WORDS.length - 1 ? ' ' : ''}
            </Fragment>
          );
        })}
      </p>
      <p className="max-w-[640px] font-chrome text-title text-ink">{PROMISE}</p>
      <div className="flex flex-wrap items-center gap-16">
        <Button keycap="K" onClick={focusAskInput}>
          Ask the system
        </Button>
        <a href="/storybook/" className={storybookLinkClasses}>
          Storybook
        </a>
      </div>
    </div>
  );
}
