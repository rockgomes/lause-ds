'use client';

import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { Keycap } from '../Keycap/Keycap.js';
import { disabledControl, focusRing, hitTarget, hoverFade, type SurfaceState } from '../styles.js';

export type TileState = SurfaceState;

export type TileProps = ComponentProps<'button'> & {
  /** idle: available. selected: chosen, accent ring. filled: written in, ink. dimmed: no longer relevant. */
  state?: TileState;
  /** The number key that picks this tile. */
  keycap?: string;
};

const states: Record<TileState, string> = {
  idle: 'bg-surface text-ink shadow-tile enabled:hover:bg-surface-hover enabled:active:bg-surface-hover enabled:active:shadow-none',
  selected:
    'bg-surface text-ink shadow-tile ring-(length:--lause-stroke-focus) ring-accent enabled:hover:bg-surface-hover enabled:active:bg-surface-hover enabled:active:shadow-none',
  filled: 'bg-ink text-on-ink enabled:hover:bg-ink-hover enabled:active:bg-ink-active',
  dimmed:
    'bg-surface text-dim shadow-tile enabled:hover:bg-surface-hover enabled:active:bg-surface-hover enabled:active:shadow-none',
};

/** An option or word tile. Tiles stack vertically in a TileStack; they never sit in a row except the two of a true/false item.
 * Drawn as the boards draw the option pills (`LauseExam.png`, `LauseOnboard.png`): the chrome face at the title size, the
 * keycap on the right edge, tall enough to read as a button, not a row. */
export function Tile({ state = 'idle', keycap, className, children, type = 'button', ...rest }: TileProps) {
  return (
    <button
      type={type}
      data-state={state}
      aria-pressed={state === 'selected' || state === 'filled'}
      aria-disabled={state === 'dimmed' || undefined}
      className={clsx(
        'flex w-full items-center gap-16 rounded-control px-24 py-16 text-left font-chrome text-title',
        hitTarget,
        focusRing,
        disabledControl,
        hoverFade,
        states[state],
        className,
      )}
      {...rest}
    >
      <span className="flex-1">{children}</span>
      {keycap ? <Keycap aria-hidden="true" className="shrink-0">{keycap}</Keycap> : null}
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
