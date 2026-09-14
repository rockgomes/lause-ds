import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { Bubble } from './Bubble.js';

/** A word with a bubble above it, the way Sentence uses it. */
function Word({ children, bubble }: { children: string; bubble: ReactNode }) {
  return (
    <p className="mt-64 font-content text-reading">
      <span className="relative">
        {children}
        {bubble}
      </span>
    </p>
  );
}

const meta = {
  title: 'Bubble',
  component: Bubble,
  args: { children: 'to stand as a candidate', count: 1 },
  render: (args) => <Word bubble={<Bubble {...args} />}>kandideerida</Word>,
} satisfies Meta<typeof Bubble>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pinned: Story = {
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    await expect(note).toHaveTextContent('to stand as a candidate');
    await expect(note).toHaveTextContent('×1');
    const count = note.querySelector('[aria-hidden]');
    await expect(count).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Promoted: Story = { args: { children: 'with the right to vote', count: 3, note: '→ kordamisse' } };

export const NoCount: Story = { args: { count: undefined } };

/**
 * A gloss wider than the word it sits over must still render as one line: the Sentence's line
 * height (1.85) exists so a one-line bubble never covers the line above it.
 */
export const LongGloss: Story = {
  args: { children: 'with the right to vote', count: 3 },
  render: (args) => <Word bubble={<Bubble {...args} />}>x</Word>,
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    const style = getComputedStyle(note);
    await expect(style.whiteSpace).toBe('nowrap');
    const lineHeight = Number.parseFloat(style.lineHeight);
    const height = note.getBoundingClientRect().height;
    await expect(height).toBeLessThan(lineHeight * 2);
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-col gap-32">
      <Word bubble={<Bubble count={1}>to stand as a candidate</Bubble>}>kandideerida</Word>
      <Word bubble={<Bubble count={3} note="→ kordamisse">with the right to vote</Bubble>}>hääleõiguslik</Word>
    </div>
  ),
};
