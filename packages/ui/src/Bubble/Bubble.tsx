'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode, type Ref } from 'react';

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

/** The body bubble keeps this far inside the viewport and inside its clipping ancestor, in px. */
const EDGE = 8;

/** The nearest ancestor that clips or scrolls sideways (computed overflow-x is not visible), if any. */
function clippingAncestor(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
    if (getComputedStyle(node).overflowX !== 'visible') return node;
  }
  return null;
}

/**
 * Shifts a body bubble sideways so it stays inside the visible box: the viewport and its clipping
 * ancestor, each less 8 px. The shift goes into --bubble-shift, which moves the bubble one way and
 * its tail the other way, so the tail stays over the word.
 */
function keepInView(el: HTMLElement) {
  el.style.setProperty('--bubble-shift', '0px');
  const rect = el.getBoundingClientRect();
  let left = EDGE;
  let right = document.documentElement.clientWidth - EDGE;
  const clip = clippingAncestor(el);
  if (clip) {
    const box = clip.getBoundingClientRect();
    const inner = box.left + clip.clientLeft;
    left = Math.max(left, inner + EDGE);
    right = Math.min(right, inner + clip.clientWidth - EDGE);
  }
  let shift = 0;
  // Too wide for the box: keep its start in view, where reading begins.
  if (rect.left < left || rect.width > right - left) shift = left - rect.left;
  else if (rect.right > right) shift = right - rect.right;
  el.style.setProperty('--bubble-shift', `${shift}px`);
}

const SHARED =
  'pointer-events-none absolute bottom-full left-1/2 rounded-bubble bg-ink px-12 py-4 font-chrome italic font-normal text-on-ink ' +
  // the tail
  "after:absolute after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-ink after:content-['']";
const SIZE = {
  title: '-translate-x-1/2 max-w-[min(320px,90vw)] whitespace-normal text-balance sm:max-w-none sm:whitespace-nowrap text-title after:left-1/2',
  // body: at 16 px the inline box's top is only about 4.5 px above the letters, so the 8 px tail would overlap them; mb-8 lifts the bubble clear.
  // It wraps inside 240 px and moves by --bubble-shift; the tail moves back by the same amount, never closer than 12 px to either end.
  body:
    'translate-x-[calc(var(--bubble-shift,0px)_-_50%)] w-max max-w-[min(240px,calc(100vw_-_32px))] whitespace-normal text-pretty text-left text-body mb-8 ' +
    'after:left-[clamp(12px,calc(50%_-_var(--bubble-shift,0px)),calc(100%_-_12px))]',
};

/**
 * A translation bubble that sits above the word it belongs to. Render it inside an element with
 * `position: relative`; it centres itself over that element and draws a tail down to it. At body
 * size it wraps (at most 240 px wide) and keeps itself inside the visible box, the viewport and its
 * nearest ancestor that clips sideways, by shifting sideways; the tail stays over the word.
 */
export function Bubble({ children, count, note, size = 'title', className, ref, ...rest }: BubbleProps) {
  const own = useRef<HTMLSpanElement | null>(null);
  const setRef = useCallback(
    (el: HTMLSpanElement | null) => {
      own.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLSpanElement | null }).current = el;
    },
    [ref],
  );
  const body = size === 'body';

  // Every render: the gloss, the count or the layout around the word may have changed.
  useLayoutEffect(() => {
    if (body && own.current) keepInView(own.current);
  });
  useEffect(() => {
    if (!body) return;
    const onResize = () => {
      if (own.current) keepInView(own.current);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [body]);

  return (
    <span role="note" ref={setRef as Ref<HTMLSpanElement>} className={clsx(SHARED, SIZE[size], className)} {...rest}>
      {children}
      {count !== undefined ? (
        <span aria-hidden="true" className="ml-8 not-italic font-semibold text-label text-accent-text-on-ink">
          ×{count}
          {note ? ` ${note}` : null}
        </span>
      ) : null}
    </span>
  );
}
