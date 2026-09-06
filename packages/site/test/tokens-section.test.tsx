import { page } from '@vitest/browser/context';
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
      // Check only in the light row (data-swatch), not the dark card which also now displays names.
      const lightSwatches = document.querySelectorAll('[data-swatch]');
      const colorNameInLight = Array.from(lightSwatches).find(swatch =>
        Array.from(swatch.querySelectorAll('p')).some(el => el.textContent === p.name)
      );
      expect(colorNameInLight, p.name).toBeDefined();
      const nameEl = colorNameInLight!.querySelector('p')!;
      await expect.element(nameEl).toBeVisible();
      expect(colorNameInLight!.textContent).toContain(p.light);
      expect(colorNameInLight!.textContent).toContain(p.dark);
    }
    expect(document.querySelectorAll('[data-swatch]').length).toBe(colourPairs().length);
  });

  it('shows every type role at its own size', async () => {
    await render(<Tokens />);
    const display = document.querySelector('[data-role="display"]') as HTMLElement;
    const label = document.querySelector('[data-role="label"]') as HTMLElement;
    expect(parseFloat(getComputedStyle(display).fontSize)).toBeGreaterThan(parseFloat(getComputedStyle(label).fontSize));
  });
  it('never breaks a specimen word on narrow screens; the row scrolls instead', async () => {
    await render(<Tokens />);
    for (const width of [390, 320]) {
      await page.viewport(width, 900);
      const display = document.querySelector('[data-role="display"]') as HTMLElement;
      const lineHeight = parseFloat(getComputedStyle(display).lineHeight);
      expect(display.getBoundingClientRect().height, `display sample at ${width}`).toBeLessThanOrEqual(lineHeight * 1.5);
      expect(document.documentElement.scrollWidth, `page width at ${width}`).toBeLessThanOrEqual(width);
    }
    await page.viewport(1440, 900);
  });
});
