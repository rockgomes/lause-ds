import { Fragment, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Bubble, Button } from 'lause-ds';

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
// Storybook link is a plain <a> styled to match. These classes are copied from
// packages/ui/src/Button/Button.tsx's outline variant and packages/ui/src/styles.ts
// (focusRing, hitTarget, hoverFade) — none of those are exported from `lause-ds` (Plan 3 parked
// that) — with the `enabled:` variants dropped, since `:enabled` never matches an anchor.
const storybookLinkClasses =
  'inline-flex items-center justify-center gap-8 rounded-control px-24 font-chrome text-body font-semibold min-h-[44px] ' +
  'focus-visible:outline-(length:--lause-stroke-focus) focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'transition-colors duration-120 motion-reduce:transition-none ' +
  'border-(length:--lause-stroke-thin) border-ink text-ink hover:bg-ground-hover active:bg-ground-hover';

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
  const target = ask?.querySelector<HTMLElement>('input, textarea, [role="radio"][aria-checked="true"]');
  (target ?? ask)?.focus();
}

export type HeroProps = {
  /** Defaults to the `(prefers-reduced-motion: reduce)` media query. */
  reducedMotion?: boolean;
};

/** The story's opening sentence, assembling word by word, then peeking its three glosses. */
export function Hero({ reducedMotion }: HeroProps) {
  const reduced = reducedMotion ?? prefersReducedMotion();
  const [revealed, setRevealed] = useState(reduced ? WORDS.length : 0);
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    if (reduced) {
      setRevealed(WORDS.length);
      setPeeking(false);
      return;
    }
    setRevealed(0);
    setPeeking(false);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    WORDS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) setRevealed((r) => Math.max(r, i + 1));
        }, i * STEP_MS),
      );
    });
    timers.push(
      setTimeout(() => {
        if (cancelled || isTouchDevice()) return;
        setPeeking(true);
        timers.push(
          setTimeout(() => {
            if (!cancelled) setPeeking(false);
          }, PEEK_MS),
        );
      }, WORDS.length * STEP_MS),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced]);

  return (
    <div className="flex flex-col items-start gap-32">
      <p lang="et" className="w-full break-words font-content text-headline-narrow text-ink hyphens-auto sm:text-headline">
        {WORDS.map((word, i) => (
          <Fragment key={i}>
            <span
              data-word
              data-state={reduced || i < revealed ? 'in' : 'pending'}
              className={clsx(
                // max-w-full: without it an `inline-block` box sizes to its own text regardless of
                // the container, so `break-words`/`hyphens-auto` on the <p> never gets a chance to
                // apply to a long unbreakable word (measured directly: "hääleõiguslik" alone runs to
                // ~320px at the phone's 48px headline size, wider than the 272px column at 320px).
                'relative inline-block max-w-full',
                word.term && 'underline decoration-accent decoration-(length:--lause-stroke-mark) underline-offset-(length:--lause-space-4) [text-decoration-skip-ink:none]',
              )}
            >
              {word.text}
              {word.term && peeking ? <Bubble>{word.term.gloss}</Bubble> : null}
            </span>
            {i < WORDS.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
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
