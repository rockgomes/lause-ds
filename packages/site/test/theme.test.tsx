import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { useTheme } from '../src/theme.js';

function Probe() {
  const [theme, setTheme] = useTheme();
  return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme}</button>;
}

describe('useTheme', () => {
  it('writes data-theme on <html> and persists', async () => {
    localStorage.removeItem('lause-theme');
    const screen = await render(<Probe />);
    await expect.element(screen.getByRole('button')).toHaveTextContent('light');
    await screen.getByRole('button').click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('lause-theme')).toBe('dark');
  });
});
