'use client';

import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export type ProgressProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Number of units: sentences, cards, questions, arrows. */
  total: number;
  /** Zero-based index of the current unit. Units before it are done. Pass `total` when everything is done. */
  current: number;
  /** Accessible name, e.g. "Lause 5 / 8". */
  label: string;
};

type SegmentState = 'done' | 'current' | 'rest';

// Segments are aria-hidden: the bar's accessible name carries the counts, so the faint fill
// (ink at 18%) is decorative and outside the contrast gate by design.
const fills: Record<SegmentState, string> = {
  done: 'bg-ink',
  current: 'bg-accent',
  rest: 'bg-ink opacity-(--lause-opacity-faint)',
};

/** The segmented bar under every screen: done in ink, current in accent, the rest faint. */
export function Progress({ total, current, label, className, ...rest }: ProgressProps) {
  const now = Math.max(0, Math.min(current, total));
  const stateOf = (i: number): SegmentState => (i < now ? 'done' : i === now ? 'current' : 'rest');
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={now}
      className={clsx('flex w-full gap-2', className)}
      {...rest}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden="true" data-state={stateOf(i)} className={clsx('h-4 flex-1 rounded-control', fills[stateOf(i)])} />
      ))}
    </div>
  );
}
