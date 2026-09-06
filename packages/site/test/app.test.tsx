import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { App, SECTIONS } from '../src/App.js';

describe('App', () => {
  it('renders every section in order, the story section holding the Hero', async () => {
    const screen = await render(<App />);
    const ids = Array.from(document.querySelectorAll('main > section')).map((s) => s.id);
    expect(ids).toEqual(SECTIONS.map((s) => s.id));
    // The story section's heading is the Hero itself (Task 3) — it has no separate "Story" title.
    // `.first()`: the Components section's Sentence example (Task 5) opens with the same words.
    await expect.element(screen.getByText(/Riigikogusse võib/).first()).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'Tokens' })).toBeVisible();
  });

  it('holds the Nav in the page side padding — 64px desktop, 24px phone', async () => {
    await page.viewport(1440, 900);
    const wide = await render(<App />);
    const header = document.querySelector('header')!;
    expect(header.getBoundingClientRect().left).toBeGreaterThanOrEqual(64);
    wide.unmount();

    await page.viewport(390, 844);
    const narrow = await render(<App />);
    const headerNarrow = document.querySelector('header')!;
    expect(headerNarrow.getBoundingClientRect().left).toBeGreaterThanOrEqual(24);
    narrow.unmount();
  });

  it('shows the full Nav from the tablet breakpoint up, and only the context and dial below 640px', async () => {
    // Scoped to the site's own top Nav (aria-label "Site sections") — the Components section
    // (Task 5) embeds a live Nav example of its own ("Peamenüü") that is not part of this check.
    await page.viewport(1440, 900);
    const wide = await render(<App />);
    expect(document.querySelector('nav[aria-label="Site sections"]')!.querySelectorAll('a').length).toBe(4);
    wide.unmount();

    for (const width of [390, 320]) {
      await page.viewport(width, 900);
      const screen = await render(<App />);
      expect(document.querySelector('nav[aria-label="Site sections"]')).toBeNull();
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
      screen.unmount();
    }
  });

  it('does not overflow at 320px — the story sentence wraps instead', async () => {
    await page.viewport(320, 900);
    await render(<App />);
    const story = document.getElementById('story')!;
    expect(story.scrollWidth).toBeLessThanOrEqual(story.clientWidth);
  });

  it('the footer reading progress starts at 0, the first section, not 1', async () => {
    // Regression for the off-by-one: `current` passed to <Progress> is `index` (0-based), not
    // `index + 1` — with the bug this read '1' even before any scrolling, since
    // `useSectionProgress` already defaults `index` to 0 for the first section.
    await page.viewport(1440, 900);
    const screen = await render(<App />);
    const footer = screen.getByRole('progressbar', { name: 'Reading progress' });
    await expect.element(footer).toHaveAttribute('aria-valuenow', '0');
  });
});
