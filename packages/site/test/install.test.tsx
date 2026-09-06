import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Install } from '../src/sections/Install.js';

describe('Install', () => {
  it('copy button copies command and shows feedback', async () => {
    // Stub navigator.clipboard.writeText
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => {}) },
      configurable: true,
    });

    render(<Install />);
    await new Promise((r) => setTimeout(r, 200)); // let component settle

    // Get all copy buttons (there should be 3 commands)
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
    const copyButton = buttons[0]; // first button is the first "Copy"
    expect(copyButton).toBeDefined();
    expect(copyButton.textContent).toBe('Copy');

    // Click the first copy button
    copyButton.click();

    // Wait for the async copy operation to complete
    await new Promise((r) => setTimeout(r, 50));

    // Expect writeText called with the first command
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('npm install lause-ds');

    // Expect button text to change to "Copied"
    expect(copyButton.textContent).toBe('Copied');

    // Expect aria-live region to announce the change
    expect(copyButton.getAttribute('aria-live')).toBe('polite');

    // Wait ~1.6s for reset (the timeout is 1500ms)
    await new Promise((r) => setTimeout(r, 1700));

    // Button text should be back to "Copy"
    expect(copyButton.textContent).toBe('Copy');
  });

  it('copy button handles missing clipboard gracefully', async () => {
    // Remove clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });

    render(<Install />);
    await new Promise((r) => setTimeout(r, 200)); // let component settle

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
    const copyButton = buttons[0];
    expect(copyButton).toBeDefined();
    expect(copyButton.textContent).toBe('Copy');

    // Click should not throw
    expect(() => {
      copyButton.click();
    }).not.toThrow();

    // Text should stay "Copy"
    expect(copyButton.textContent).toBe('Copy');
  });
});
