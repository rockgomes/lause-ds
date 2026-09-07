import { useSyncExternalStore } from 'react';

// One `MediaQueryList` per query string, reused across every `useMediaQuery` call and every
// subscribe/getSnapshot invocation for that query, `matchMedia` returns a fresh (but
// behaviourally identical) object on each call otherwise, which is wasted allocation on a hook
// that re-reads its snapshot on every render.
const mediaQueryLists = new Map<string, MediaQueryList>();

function getMediaQueryList(query: string): MediaQueryList {
  let mql = mediaQueryLists.get(query);
  if (!mql) {
    mql = window.matchMedia(query);
    mediaQueryLists.set(query, mql);
  }
  return mql;
}

/** Subscribes to a `matchMedia` query, re-rendering the component when it flips. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = getMediaQueryList(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => getMediaQueryList(query).matches,
    () => false,
  );
}
