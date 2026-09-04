import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button.js';
import { Keycap } from '../Keycap/Keycap.js';
import { usePeek } from './usePeek.js';
import { restFocus } from '../test-utils.js';

/** Shows the hook's state and offers the latch, the way the reader's bottom bar does. */
function PeekDemo() {
  const [latched, setLatched] = useState(false);
  const { peeking, held } = usePeek({ latched });
  return (
    <div className="flex flex-col gap-16">
      <p className="text-body" data-testid="state" data-peeking={peeking} data-held={held}>
        {peeking ? 'Reader' : 'Lugeja'} <Keycap held={held}>⌥</Keycap>
      </p>
      <Button variant="outline" aria-pressed={latched} onClick={() => setLatched(!latched)}>
        Hoia inglise keeles
      </Button>
    </div>
  );
}

const meta = { title: 'usePeek', component: PeekDemo } satisfies Meta<typeof PeekDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HoldAlt: Story = {
  play: async ({ canvasElement }) => {
    const state = within(canvasElement).getByTestId('state');
    await expect(state).toHaveAttribute('data-peeking', 'false');
    await userEvent.keyboard('{Alt>}');
    await expect(state).toHaveAttribute('data-peeking', 'true');
    await expect(state).toHaveAttribute('data-held', 'true');
    await expect(state).toHaveTextContent('Reader');
    // Storybook's userEvent is synthetic: it does not dispatch real keyboard events onto
    // `window`, so releasing the held key needs a manual window-level KeyboardEvent here.
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt', bubbles: true }));
    await new Promise(requestAnimationFrame);
    await expect(state).toHaveAttribute('data-peeking', 'false');
    await expect(state).toHaveTextContent('Lugeja');
  },
};

export const Latch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const state = canvas.getByTestId('state');
    const latch = canvas.getByRole('button', { name: 'Hoia inglise keeles' });
    await userEvent.click(latch);
    await expect(latch).toHaveAttribute('aria-pressed', 'true');
    await expect(state).toHaveAttribute('data-peeking', 'true');
    await expect(state).toHaveAttribute('data-held', 'false');
    await userEvent.click(latch);
    await expect(state).toHaveAttribute('data-peeking', 'false');
    restFocus();
  },
};

export const ClearsOnBlur: Story = {
  play: async ({ canvasElement }) => {
    const state = within(canvasElement).getByTestId('state');
    await userEvent.keyboard('{Alt>}');
    await expect(state).toHaveAttribute('data-peeking', 'true');
    window.dispatchEvent(new Event('blur'));
    await new Promise(requestAnimationFrame);
    await expect(state).toHaveAttribute('data-peeking', 'false');
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt', bubbles: true }));
  },
};

export const LatchSurvivesBlur: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const state = canvas.getByTestId('state');
    const latch = canvas.getByRole('button', { name: 'Hoia inglise keeles' });
    await userEvent.click(latch);
    await expect(state).toHaveAttribute('data-peeking', 'true');
    window.dispatchEvent(new Event('blur'));
    await new Promise(requestAnimationFrame);
    await expect(state).toHaveAttribute('data-peeking', 'true');
    await userEvent.click(latch);
    restFocus();
  },
};

export const Dark: Story = { globals: { theme: 'dark' } };
