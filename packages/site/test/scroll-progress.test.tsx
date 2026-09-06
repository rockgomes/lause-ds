import { page } from '@vitest/browser/context';
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

describe('useSectionProgress', () => {
  it('reports the section nearest the viewport middle', async () => {
    await page.viewport(800, 600);
    const screen = await render(<Sections />);
    window.scrollTo(0, 2500);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect.element(screen.getByTestId('current')).toHaveTextContent('c');
  });
});
