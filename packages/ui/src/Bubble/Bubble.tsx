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
  /** title: over reading-size text (the reader). body: over 16 px text, so it covers less of the line above. */
  size?: 'title' | 'body';
};

/**
 * A translation bubble that sits above the word it belongs to. Render it inside an element with
 * `position: relative`; it centres itself over that element and draws a tail down to it.
 */
export function Bubble({ children, count, note, size = 'title', className, ...rest }: BubbleProps) {
  return (
    <span
      role="note"
      className={clsx(
        'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 max-w-[min(320px,90vw)] whitespace-normal text-balance sm:max-w-none sm:whitespace-nowrap rounded-bubble bg-ink px-12 py-4 font-chrome italic font-normal text-on-ink',
        // body: at 16 px the inline box's top is only about 4.5 px above the letters, so the 8 px tail would overlap them; mb-8 lifts the bubble clear.
        size === 'body' ? 'text-body mb-8' : 'text-title',
        // the tail
        "after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-ink after:content-['']",
        className,
      )}
      {...rest}
    >
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
