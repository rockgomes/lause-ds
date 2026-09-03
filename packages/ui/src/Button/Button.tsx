import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { Keycap } from '../Keycap/Keycap.js';

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
        // 44px: WCAG 2.5.8 target size, a rule rather than a token
        'inline-flex min-h-[44px] items-center justify-center gap-8 rounded-control px-24 font-chrome text-body font-semibold',
        'focus-visible:outline-(length:--lause-stroke-focus) focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-(--lause-opacity-dim)',
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
