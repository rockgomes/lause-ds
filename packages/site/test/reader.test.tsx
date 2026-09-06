import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from '@vitest/browser/context';
import { Reader } from '../src/sections/Reader.js';

// The brief's Step 1 snippet writes `const screen = render(<Reader />)` without an `await` — every
// other test in this package awaits `render` (it returns a Promise, per vitest-browser-react's
// types), so that is followed here too; the queries and assertions match the brief verbatim.
describe('Reader section', () => {
  it('pins a term on click and shows its gloss', async () => {
    const screen = await render(<Reader />);
    await screen.getByRole('button', { name: /kandideerida/ }).click();
    // `.first()`: pinning also updates the sr-only `aria-live` region (Sentence.tsx) with the same
    // gloss text, so the plain string is a strict-mode ambiguity — `.first()` picks the visible
    // bubble, which is first in DOM order (the App test does the same for a similar collision).
    await expect.element(screen.getByText('to stand as a candidate').first()).toBeVisible();
  });

  it('shows every gloss while the modifier is held', async () => {
    const screen = await render(<Reader />);
    await userEvent.keyboard('{Alt>}');
    await expect.element(screen.getByText('citizen')).toBeVisible();
    await userEvent.keyboard('{/Alt}');
  });

  it('switches support level with the dial', async () => {
    const screen = await render(<Reader />);
    await screen.getByRole('radio', { name: 'Kõrvuti' }).click();
    await expect.element(screen.getByText(/Any citizen/)).toBeVisible();
  });

  it('clears every pin on Escape', async () => {
    const screen = await render(<Reader />);
    await screen.getByRole('button', { name: /kandideerida/ }).click();
    await expect.element(screen.getByRole('button', { name: /kandideerida/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{Escape}');
    await expect.element(screen.getByRole('button', { name: /kandideerida/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('on touch devices, replaces the keycap row with a latch Button that toggles every gloss', async () => {
    const screen = await render(<Reader touch />);
    // No ⌥ hint on a touch device.
    expect(screen.container.textContent).not.toMatch(/peek/);
    const button = screen.getByRole('button', { name: 'Show all glosses' });
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');

    await button.click();
    await expect.element(button).toHaveAttribute('aria-pressed', 'true');
    await expect.element(screen.getByText('citizen')).toBeVisible();

    await button.click();
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('the support dial hugs its own content instead of stretching the width of the Sentence', async () => {
    await page.viewport(1440, 900);
    const screen = await render(<Reader />);
    const dial = screen.getByRole('radiogroup', { name: 'Support level' }).element();
    expect(dial.getBoundingClientRect().width).toBeLessThan(400);
  });

  it('at 390px the long Estonian term wraps within the reading column instead of being clipped', async () => {
    await page.viewport(390, 844);
    const screen = await render(<Reader />);
    const term = screen.getByRole('button', { name: 'hääleõiguslik' }).element();
    expect(term.getBoundingClientRect().right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  });
});
