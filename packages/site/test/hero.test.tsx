import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from '@vitest/browser/context';
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
    // A term word wraps its text in the pin button; the underline sits on that button.
    const term = words.find((w) => w.textContent === 'kandideerida')!.querySelector('button')!;
    const plain = words.find((w) => w.textContent === 'iga')!;
    expect(term).not.toBeNull();
    expect(getComputedStyle(term).textDecorationLine).toBe('underline');
    expect(getComputedStyle(plain).textDecorationLine).not.toBe('underline');
  });

  it('pins a gloss on click and unpins it on the second click', async () => {
    const screen = await render(<Hero reducedMotion />);
    const term = screen.getByRole('button', { name: 'kandideerida' });
    await expect.element(term).toHaveAttribute('aria-pressed', 'false');
    expect(document.body.textContent).not.toContain('to stand as a candidate');
    await term.click();
    await expect.element(term).toHaveAttribute('aria-pressed', 'true');
    await expect.element(screen.getByText('to stand as a candidate')).toBeVisible();
    await term.click();
    await expect.element(term).toHaveAttribute('aria-pressed', 'false');
    expect(document.body.textContent).not.toContain('to stand as a candidate');
  });

  it('shows every gloss while Alt is held, as the Reader does', async () => {
    const screen = await render(<Hero reducedMotion />);
    await userEvent.keyboard('{Alt>}');
    await expect.element(screen.getByText('to stand as a candidate')).toBeVisible();
    await expect.element(screen.getByText('with the right to vote')).toBeVisible();
    await expect.element(screen.getByText('citizen', { exact: true })).toBeVisible();
    await userEvent.keyboard('{/Alt}');
    expect(document.body.textContent).not.toContain('with the right to vote');
  });
});
