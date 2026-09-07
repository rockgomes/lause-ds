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
    // Right after render, revealed starts at 0, every word is still pending.
    expect(document.querySelectorAll('[data-word][data-state="pending"]').length).toBeGreaterThan(0);
    await new Promise((r) => setTimeout(r, 60 * words.length + 400));
    expect(document.querySelectorAll('[data-word][data-state="pending"]').length).toBe(0);
  });

  it('marks each of the three terms with the Sentence underline, and no other word', async () => {
    await render(<Hero reducedMotion />);
    const words = Array.from(document.querySelectorAll<HTMLElement>('[data-word]'));
    const term = words.find((w) => w.textContent === 'kandideerida')!;
    const plain = words.find((w) => w.textContent === 'iga')!;
    expect(getComputedStyle(term).textDecorationLine).toBe('underline');
    expect(getComputedStyle(plain).textDecorationLine).not.toBe('underline');
  });
});
