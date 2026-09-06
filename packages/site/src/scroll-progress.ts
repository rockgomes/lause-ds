'use client';

import { useEffect, useState } from 'react';

export type SectionProgress = {
  /** The id of the section currently crossing the viewport's vertical middle. */
  current: string;
  /** `current`'s position in the `ids` passed in. */
  index: number;
};

/**
 * Tracks which of the given sections is "current" while the page scrolls. An IntersectionObserver
 * watches every id with `rootMargin: '-50% 0px -50% 0px'`, which shrinks the observed root to a
 * single line across the viewport's vertical middle — a section is "current" for as long as its
 * band covers that line. Reports the last section whose top crossed it, defaulting to the first
 * id until any section has.
 */
export function useSectionProgress(ids: readonly string[]): SectionProgress {
  const [current, setCurrent] = useState(ids[0] ?? '');

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  const index = Math.max(0, ids.indexOf(current));
  return { current, index };
}
