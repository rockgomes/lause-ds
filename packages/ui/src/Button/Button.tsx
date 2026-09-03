import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { Keycap } from '../Keycap/Keycap.js';
import { disabledControl, focusRing, hitTarget } from '../styles.js';

export type ButtonVariant = 'filled' | 'outline' | 'dim';

export type ButtonProps = ComponentProps<'button'> & {
  /** filled: the one primary action. outline: secondary. dim: tertiary, text only. */
  variant?: ButtonVariant;
  /** The key that triggers this action; drawn as a Keycap after the label. */
  keycap?: string;
};

const variants: Record<ButtonVariant, string> = {
  filled: 'bg-ink text-on-ink',
  outline: 'border-(length:--lause-stroke-thin) border-ink text-ink',
  dim: 'text-dim',
};

/** A pill button. Every control in Lause shows its key, so pass `keycap` whenever there is one. */
export function Button({ variant = 'filled', keycap, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-8 rounded-control px-24 font-chrome text-body font-semibold',
        hitTarget,
        focusRing,
        disabledControl,
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
      {keycap ? <Keycap aria-hidden="true">{keycap}</Keycap> : null}
    </button>
  );
}
