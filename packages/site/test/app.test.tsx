import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { App, SECTIONS } from '../src/App.js';

describe('App', () => {
  it('renders every section in order, the story section holding the Hero', async () => {
    const screen = await render(<App />);
    const ids = Array.from(document.querySelectorAll('main > section')).map((s) => s.id);
    expect(ids).toEqual(SECTIONS.map((s) => s.id));
    // The story section's heading is the Hero itself (Task 3) — it has no separate "Story" title.
    await expect.element(screen.getByText(/Riigikogusse võib/)).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'Tokens' })).toBeVisible();
  });
});
