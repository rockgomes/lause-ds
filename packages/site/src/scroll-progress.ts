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
  // A short last section may never reach the viewport's middle line, so the end of the page
  // counts as the last section: otherwise the reading progress could never complete.
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const check = () => {
      const root = document.documentElement;
      setAtEnd(window.innerHeight + window.scrollY >= root.scrollHeight - 2);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

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

  const last = ids[ids.length - 1] ?? '';
  const resolved = atEnd && last ? last : current;
  const index = Math.max(0, ids.indexOf(resolved));
  return { current: resolved, index };
}
