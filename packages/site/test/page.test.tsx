import axe from 'axe-core';
import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { App } from '../src/App.js';

describe('page', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`has no axe violations in ${theme}`, async () => {
      document.documentElement.dataset.theme = theme;
      render(<App />);
      await new Promise((r) => setTimeout(r, 2000)); // hero settles
      const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: true } } });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }

  it('never scrolls horizontally from 320 to 1920', async () => {
    render(<App />);
    await new Promise((r) => setTimeout(r, 2000));
    for (const w of [320, 390, 768, 1024, 1440, 1920]) {
      // vitest browser: the viewport is set by page.setViewportSize via the `page` helper
      await page.viewport(w, 900);
      expect(document.documentElement.scrollWidth, `at ${w}`).toBeLessThanOrEqual(w);
    }
  });

  it('every interactive element shows a focus ring', async () => {
    // The previous test leaves the browser viewport at 1920×900; resetting it first (and giving
    // React a moment to settle) avoids a flaky empty query on a freshly resized, not-yet-painted
    // page, the assertion below is about focus rings, not layout, so a stable mid-size viewport
    // is enough.
    await page.viewport(1280, 900);
    render(<App />);
    await new Promise((r) => setTimeout(r, 200));
    const controls = Array.from(document.querySelectorAll<HTMLElement>('a, button, input, textarea, [role="radio"]'));
    expect(controls.length).toBeGreaterThan(10);
    for (const el of controls) {
      // A programmatic `.focus()` does not reliably trigger `:focus-visible` in Chromium for a
      // mouse-like focus path, `{ focusVisible: true }` forces the focus-visible heuristic on,
      // matching how a keyboard user would actually reach these controls.
      el.focus({ focusVisible: true } as FocusOptions);
      const s = getComputedStyle(el, ':focus-visible');
      expect(s.outlineStyle !== 'none' || s.boxShadow !== 'none', el.outerHTML.slice(0, 80)).toBe(true);
    }
  });

  it('scrolls a focused control clear of the fixed footer', async () => {
    await page.viewport(1440, 900);
    render(<App />);
    await new Promise((r) => setTimeout(r, 2000)); // hero settles
    const links = document.querySelectorAll<HTMLAnchorElement>('[data-component] a');
    const lastGalleryLink = links[links.length - 1];
    expect(lastGalleryLink).toBeDefined();
    lastGalleryLink.focus();
    await new Promise((r) => setTimeout(r, 100)); // let the browser's scroll-into-view settle
    expect(lastGalleryLink.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight - 64);
  });
});
