import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { App, SECTIONS } from '../src/App.js';

describe('App', () => {
  it('renders every section in order with a heading', async () => {
    const screen = await render(<App />);
    const ids = Array.from(document.querySelectorAll('main > section')).map((s) => s.id);
    expect(ids).toEqual(SECTIONS.map((s) => s.id));
    await expect.element(screen.getByRole('heading', { name: 'Story' })).toBeVisible();
  });
});
