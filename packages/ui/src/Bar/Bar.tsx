'use client';

import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export type BarSegment = 'retained' | 'covered' | 'unread';

export type BarProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** One entry per article, in article order. */
  segments: readonly BarSegment[];
  /** The counts in words, e.g. "Riigikord: 4 kinnistunud, 2 loetud, 4 lugemata, kokku 10". This is the accessible name. */
  label: string;
};

const fills: Record<BarSegment, string> = {
  retained: 'bg-ink',
  covered: 'bg-accent',
  unread: 'bg-ink opacity-(--lause-opacity-faint)',
};

/** Coverage of one domain: one segment per article. Read and retained in ink, read but not retained in accent, unread faint. */
export function Bar({ segments, label, className, ...rest }: BarProps) {
  return (
    <div role="img" aria-label={label} className={clsx('flex w-full gap-2', className)} {...rest}>
      {segments.map((segment, i) => (
        <span key={i} aria-hidden="true" data-segment={segment} className={clsx('h-8 flex-1 rounded-control', fills[segment])} />
      ))}
    </div>
  );
}