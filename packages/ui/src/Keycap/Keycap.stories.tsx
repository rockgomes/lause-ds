import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Keycap } from './Keycap.js';

const meta = { title: 'Keycap', component: Keycap, args: { children: '↵' } } satisfies Meta<typeof Keycap>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const kbd = within(canvasElement).getByText('↵');
    await expect(kbd.tagName).toBe('KBD');
    await expect(kbd).not.toHaveAttribute('data-held');
  },
};

export const Held: Story = {
  args: { children: '⌥', held: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('⌥')).toHaveAttribute('data-held', 'true');
  },
};

export const Row: Story = {
  render: () => (
    <p className="flex items-center gap-8 text-body">
      {['←', '→', '↵', '1', '2', '3', '4', 'Tühik', '⌥'].map((k) => (
        <Keycap key={k}>{k}</Keycap>
      ))}
    </p>
  ),
};

export const Dark: Story = { args: { children: '⌥', held: true }, globals: { theme: 'dark' } };
