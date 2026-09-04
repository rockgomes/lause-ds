'use client';

import { clsx } from 'clsx';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { focusRing, hoverFade } from '../styles.js';

export type NavItem = {
  id: string;
  /** The Estonian label, shown normally. */
  label: string;
  /** The English label, shown while peeking. */
  labelEn: string;
  href: string;
  /** A count after the label, e.g. cards due. */
  count?: number;
};

export type NavProps = Omit<ComponentProps<'header'>, 'children'> & {
  /** Top-left: where the learner is, e.g. "§ 60 · lause 5 / 8". */
  context: ReactNode;
  /** The centre items. Empty in exam mode. */
  items: readonly NavItem[];
  /** The current item's id. */
  current?: string;
  /** While true the items read their English labels. The chrome swaps; it never gains a subtitle. */
  peeking?: boolean;
  /** Top-right: the dial and the peek hint, or the exam's one action. */
  controls?: ReactNode;
  /** Accessible name of the navigation. */
  label: string;
  /** Called with the item id on click, before the link navigates. */
  onNavigate?: (id: string) => void;
};

/** The top chrome: context left, caps navigation centre, controls right. */
export function Nav({ context, items, current, peeking = false, controls, label, onNavigate, className, ...rest }: NavProps) {
  return (
    <header
      data-state={peeking ? 'peeking' : 'idle'}
      className={clsx('grid min-h-[44px] grid-cols-[1fr_auto_1fr] items-center gap-24 font-chrome text-label text-ink', className)}
      {...rest}
    >
      <div className="justify-self-start">{context}</div>
      <nav aria-label={label} className="justify-self-center">
        {items.length > 0 ? (
          <ul className="flex items-center gap-24 uppercase tracking-(--lause-type-tracking-caps)">
            {items.map((item) => {
              const isCurrent = item.id === current;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={isCurrent ? 'page' : undefined}
                    data-state={isCurrent ? 'current' : 'idle'}
                    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                      // The href supports no-JS and reflects the URL; onNavigate is for apps
                      // with client routing, which handle the transition themselves — so the
                      // browser's own navigation is prevented for a plain left-click here.
                      if (onNavigate && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                        event.preventDefault();
                        onNavigate(item.id);
                      }
                    }}
                    className={clsx(
                      'inline-flex min-h-[44px] items-center gap-8 rounded-control px-8',
                      focusRing,
                      hoverFade,
                      isCurrent ? 'text-ink' : 'text-dim hover:text-ink',
                    )}
                  >
                    {peeking ? item.labelEn : item.label}
                    {item.count !== undefined ? <span className="normal-case tracking-normal">{item.count}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </nav>
      <div className="flex items-center gap-24 justify-self-end">{controls}</div>
    </header>
  );
}
