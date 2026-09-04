'use client';

import { useEffect, useState } from 'react';

export type UsePeekOptions = {
  /** The latch: holds the peek on without the key. */
  latched?: boolean;
  /** The modifier that peeks while held. */
  key?: string;
  /** Set false to register no listeners and report `held: false`, e.g. while the reader is off-screen. */
  enabled?: boolean;
};

export type PeekState = {
  /** Every translation should show and the chrome should read English. */
  peeking: boolean;
  /** The modifier is physically down right now. */
  held: boolean;
};

/**
 * The peek gesture: hold the modifier and every translation shows; release and it goes.
 * A latch holds the same state without the key. The held modifier clears when the window
 * loses focus or is hidden; the latch is the app's and survives blur. The modifier's keydown
 * is cancelled so it cannot move focus to the browser's menu bar.
 */
export function usePeek({ latched = false, key = 'Alt', enabled = true }: UsePeekOptions = {}): PeekState {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHeld(false);
      return;
    }
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
  }, [key, enabled]);

  return { peeking: held || latched, held };
}
