import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Tokens } from '../src/sections/Tokens.js';
import { colourPairs } from '../src/data/tokens.js';

describe('Tokens section', () => {
  it('shows one swatch per semantic colour with both values', async () => {
    const screen = await render(<Tokens />);
    for (const p of colourPairs()) {
      // exact: true — several names are literal prefixes of another (`color.ground` /
      // `color.ground-hover`, `color.accent` / `color.accent-text` / `color.accent-text-on-ink`,
      // …), and Playwright's default text match is a case-insensitive substring, so the bare query
      // resolves to more than one element ("strict mode violation") without it.
      await expect.element(screen.getByText(p.name, { exact: true })).toBeVisible();
    }
    expect(document.querySelectorAll('[data-swatch]').length).toBe(colourPairs().length);
  });

  it('shows every type role at its own size', async () => {
    await render(<Tokens />);
    const display = document.querySelector('[data-role="display"]') as HTMLElement;
    const label = document.querySelector('[data-role="label"]') as HTMLElement;
    expect(parseFloat(getComputedStyle(display).fontSize)).toBeGreaterThan(parseFloat(getComputedStyle(label).fontSize));
  });
});
