import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Install } from '../src/sections/Install.js';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  // Each test below replaces navigator.clipboard for its own duration — put the real descriptor
  // back (or remove it, if there wasn't one) so it doesn't leak into whatever runs next.
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard);
  } else {
    delete (navigator as { clipboard?: unknown }).clipboard;
  }
});

describe('Install', () => {
  it('copy button copies command and shows feedback', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => {}) },
      configurable: true,
    });

    const screen = await render(<Install />);

    // Three commands, three Copy buttons — the first is `npm install lause-ds`.
    const copyButton = screen.container.querySelectorAll<HTMLButtonElement>('button')[0];
    expect(copyButton.textContent).toBe('Copy');

    copyButton.click();
    await new Promise((r) => setTimeout(r, 50)); // the copy itself is async

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('npm install lause-ds');
    expect(copyButton.textContent).toBe('Copied');
    // aria-live="polite" is on the button itself — no separate sr-only region announces this.
    expect(copyButton.getAttribute('aria-live')).toBe('polite');

    await new Promise((r) => setTimeout(r, 1700)); // past the 1500ms reset in Install.tsx
    expect(copyButton.textContent).toBe('Copy');
  });

  it('copy button handles missing clipboard gracefully', async () => {
    // Older browsers, and any page not served over HTTPS/localhost, have no clipboard at all —
    // the button should just do nothing rather than throw.
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

    const screen = await render(<Install />);
    const copyButton = screen.container.querySelectorAll<HTMLButtonElement>('button')[0];
    expect(copyButton.textContent).toBe('Copy');

    expect(() => copyButton.click()).not.toThrow();
    expect(copyButton.textContent).toBe('Copy');
  });
});
