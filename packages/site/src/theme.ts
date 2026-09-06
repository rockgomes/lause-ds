import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'lause-theme';
const listeners = new Set<() => void>();

function read(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function write(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

/** The site's light/dark switch: reads and writes `<html data-theme>`, persisted to `localStorage`. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    (): Theme => 'light',
  );
  return [theme, useCallback(write, [])];
}
