import { clsx } from 'clsx';
import type { KeyboardEvent } from 'react';
import { disabledControl, focusRing, hitTarget } from '../styles.js';

export type DialOption<V extends string> = { value: V; label: string };

export type DialProps<V extends string> = {
  /** Two or three positions. */
  options: readonly DialOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Accessible name of the group, e.g. "Tugi". */
  label: string;
  disabled?: boolean;
  className?: string;
};

const steps: Record<string, number> = Object.assign(Object.create(null), { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 });

/** A segmented control that behaves as a radio group: arrow keys move and select, Home/End jump. */
export function Dial<V extends string>({ options, value, onChange, label, disabled = false, className }: DialProps<V>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    let next: number | undefined;
    if (event.key in steps) next = (index + steps[event.key] + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    onChange(options[next].value);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={clsx(
        'inline-flex rounded-control border-(length:--lause-stroke-thin) border-ink p-2 font-chrome text-label font-semibold',
        className,
      )}
    >
      {options.map((option, i) => {
        const selected = i === index;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-control px-12',
              hitTarget,
              focusRing,
              disabledControl,
              selected ? 'bg-ink text-on-ink' : 'text-dim',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
