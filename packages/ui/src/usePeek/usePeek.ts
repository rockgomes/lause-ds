'use client';

import { useEffect, useState } from 'react';

export type UsePeekOptions = {
  /** The latch: holds the peek on without the key. */
  latched?: boolean;
  /** The modifier that peeks while held. */
  key?: string;
};

export type PeekState = {
  /** Every translation should show and the chrome should read English. */
  peeking: boolean;
  /** The modifier is physically down right now. */
  held: boolean;
};

/**
 * The peek gesture: hold the modifier and every translation shows; release and it goes.
 * A latch holds the same state without the key. Both clear when the window loses focus,
 * so the peek can never stick on. The modifier's keydown is cancelled so it cannot move
 * focus to the browser's menu bar.
 */
export function usePeek({ latched = false, key = 'Alt' }: UsePeekOptions = {}): PeekState {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key !== key) return;
      e.preventDefault();
      setHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === key) setHeld(false);
    };
    const clear = () => setHeld(false);
    const hidden = () => {
      if (document.visibilityState === 'hidden') setHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [key]);

  return { peeking: held || latched, held };
}
