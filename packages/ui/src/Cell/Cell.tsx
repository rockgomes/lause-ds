'use client';

import { clsx } from 'clsx';
import { Children, type ComponentProps, type ReactNode } from 'react';
import { Keycap } from '../Keycap/Keycap.js';
import { disabledControl, focusRing, hoverFade } from '../styles.js';

export type CellState = 'idle' | 'selected' | 'filled' | 'dimmed';

export type CellProps = Omit<ComponentProps<'button'>, 'children'> & {
  /** The row's subject, e.g. "Igaüks". */
  title: string;
  /** The column's verdict, e.g. "tohib piirata". */
  subtitle?: string;
  /** The number key that picks this cell. */
  keycap?: string;
  state?: CellState;
};

const states: Record<CellState, string> = {
  idle: 'bg-surface text-ink shadow-tile enabled:hover:bg-surface-hover enabled:active:bg-surface-hover enabled:active:shadow-none',
  selected: 'bg-surface text-ink shadow-tile ring-(length:--lause-stroke-focus) ring-accent enabled:hover:bg-surface-hover',
  filled: 'bg-ink text-on-ink enabled:hover:bg-ink-hover enabled:active:bg-ink-active',
  dimmed: 'bg-surface text-dim shadow-tile enabled:hover:bg-surface-hover',
};

/** One cell of the 2×2 drill: the subject, the verdict, and its key. */
export function Cell({ title, subtitle, keycap, state = 'idle', className, type = 'button', ...rest }: CellProps) {
  return (
    <button
      type={type}
      data-state={state}
      aria-pressed={state === 'selected'}
      className={clsx(
        'flex min-h-[44px] w-full flex-col justify-between gap-16 rounded-card px-24 py-16 text-left font-chrome',
        focusRing,
        disabledControl,
        hoverFade,
        states[state],
        className,
      )}
      {...rest}
    >
      <span className="flex w-full items-center justify-between gap-16">
        <span className="font-content text-title font-normal">{title}</span>
        {keycap ? <Keycap aria-hidden="true">{keycap}</Keycap> : null}
      </span>
      {subtitle ? <span className={clsx('text-label', state === 'filled' ? 'text-on-ink' : 'text-dim')}>{subtitle}</span> : null}
    </button>
  );
}

export type CellGridProps = {
  /** The two row headers, top to bottom. */
  rows: readonly [string, string];
  /** The two column headers, left to right. */
  columns: readonly [string, string];
  /** Accessible name of the table. */
  label: string;
  /** Exactly four cells, in reading order: row 1 left, row 1 right, row 2 left, row 2 right. */
  children: ReactNode;
  className?: string;
};

/** The 2×2 drill laid out as a table, so the headers are read with each cell. */
export function CellGrid({ rows, columns, label, children, className }: CellGridProps) {
  const cells = Children.toArray(children);
  return (
    <table aria-label={label} className={clsx('w-full max-w-[640px] border-separate border-spacing-12 font-chrome', className)}>
      <thead>
        <tr>
          <td />
          {columns.map((c) => (
            <th key={c} scope="col" className="text-label uppercase tracking-(--lause-type-tracking-caps) text-dim">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r}>
            <th scope="row" className="text-left text-label uppercase tracking-(--lause-type-tracking-caps) text-dim">
              {r}
            </th>
            <td>{cells[i * 2]}</td>
            <td>{cells[i * 2 + 1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
