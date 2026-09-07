'use client';

import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export type KeycapProps = ComponentProps<'kbd'> & {
  /** Drawn filled while the key is physically held, as ⌥ is during a peek. */
  held?: boolean;
};

/** A keyboard hint. Inherits its colour, so it follows the text of whatever holds it. */
export function Keycap({ held = false, className, children, ...rest }: KeycapProps) {
  return (
    <kbd
      data-held={held ? 'true' : undefined}
      className={clsx(
        'inline-flex min-w-24 items-center justify-center rounded-keycap border-(length:--lause-stroke-thin) border-current px-4 py-2 font-chrome text-label font-semibold not-italic',
        held && 'bg-ink text-on-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
}
