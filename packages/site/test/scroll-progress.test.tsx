import { page } from '@vitest/browser/context';
import { Progress } from 'lause-ds';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { useSectionProgress } from '../src/scroll-progress.js';

const IDS = ['a', 'b', 'c', 'd', 'e'] as const;

function Sections() {
  const { current, index } = useSectionProgress(IDS);
  return (
    <div>
      <p data-testid="current" data-index={index}>
        {current}
      </p>
      {IDS.map((id) => (
        <div key={id} id={id} style={{ height: '1000px' }} />
      ))}
    </div>
  );
}

// The same pairing App.tsx's footer uses: `useSectionProgress`'s 0-based `index` feeds
// `Progress`'s `current` directly, with no `+ 1` (Task 6 fix round 1, item 3).
function SectionsWithFooter() {
  const { index } = useSectionProgress(IDS);
  return (
    <div>
      <Progress total={IDS.length} current={index} label="Reading progress" />
      {IDS.map((id) => (
        <div key={id} id={id} style={{ height: '1000px' }} />
      ))}
    </div>
  );
}

describe('useSectionProgress', () => {
  it('reports the section nearest the viewport middle', async () => {
    await page.viewport(800, 600);
    const screen = await render(<Sections />);
    window.scrollTo(0, 2500);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect.element(screen.getByTestId('current')).toHaveTextContent('c');
  });

  it('drives a footer Progress from 0 at the top to the last index at the bottom', async () => {
    await page.viewport(800, 600);
    const screen = await render(<SectionsWithFooter />);
    const footer = screen.getByRole('progressbar', { name: 'Reading progress' });
    await expect.element(footer).toHaveAttribute('aria-valuenow', '0');

    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect.element(footer).toHaveAttribute('aria-valuenow', String(IDS.length - 1));
  });
});
