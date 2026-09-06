import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Hero } from '../src/sections/Hero.js';

describe('Hero', () => {
  it('renders the sentence complete and static under reduced motion', async () => {
    const screen = await render(<Hero reducedMotion />);
    await expect.element(screen.getByText(/Riigikogusse võib/)).toBeVisible();
    expect(document.querySelectorAll('[data-word][data-state="pending"]').length).toBe(0);
  });

  it('assembles word by word otherwise', async () => {
    await render(<Hero />);
    const words = document.querySelectorAll('[data-word]');
    expect(words.length).toBeGreaterThan(5);
    await new Promise((r) => setTimeout(r, 60 * words.length + 400));
    expect(document.querySelectorAll('[data-word][data-state="pending"]').length).toBe(0);
  });
});
