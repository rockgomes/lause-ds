'use client';

import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { Keycap } from '../Keycap/Keycap.js';
import { disabledControl, focusRing, hitTarget } from '../styles.js';

export type TileState = 'idle' | 'selected' | 'filled' | 'dimmed';

export type TileProps = ComponentProps<'button'> & {
  /** idle: available. selected: chosen, accent ring. filled: written in, ink. dimmed: no longer relevant. */
  state?: TileState;
  /** The number key that picks this tile. */
  keycap?: string;
};

const states: Record<TileState, string> = {
  idle: 'bg-surface text-ink shadow-tile',
  selected: 'bg-surface text-ink shadow-tile ring-(length:--lause-stroke-focus) ring-accent',
  filled: 'bg-ink text-on-ink',
  dimmed: 'bg-surface text-dim shadow-tile',
};

/** An option or word tile. Tiles stack vertically in a TileStack; they never sit in a row except the two of a true/false item. */
export function Tile({ state = 'idle', keycap, className, children, type = 'button', ...rest }: TileProps) {
  return (
    <button
      type={type}
      data-state={state}
      aria-pressed={state === 'selected'}
      className={clsx(
        'flex w-full items-center gap-16 rounded-control px-24 py-12 text-left font-content text-title font-normal',
        hitTarget,
        focusRing,
        disabledControl,
        states[state],
        className,
      )}
      {...rest}
    >
      {keycap ? <Keycap aria-hidden="true" className="shrink-0">{keycap}</Keycap> : null}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export type TileStackProps = ComponentProps<'div'> & {
  /** Accessible name of the group, e.g. "Vali õige vastus". */
  label: string;
};

/** The column that holds option tiles: 640px wide at most, one tile per row. */
export function TileStack({ label, className, ...rest }: TileStackProps) {
  return <div role="group" aria-label={label} className={clsx('flex w-full max-w-[640px] flex-col gap-12', className)} {...rest} />;
}