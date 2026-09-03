import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Progress } from './Progress.js';

const meta = {
  title: 'Progress',
  component: Progress,
  args: { total: 8, current: 4, label: 'Lause 5 / 8' },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Midway: Story = {
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Lause 5 / 8' });
    await expect(bar).toHaveAttribute('aria-valuemax', '8');
    await expect(bar).toHaveAttribute('aria-valuenow', '4');
    await expect(bar.querySelectorAll('[data-state="done"]')).toHaveLength(4);
    await expect(bar.querySelectorAll('[data-state="current"]')).toHaveLength(1);
    await expect(bar.querySelectorAll('[data-state="rest"]')).toHaveLength(3);
  },
};

export const First: Story = { args: { current: 0, label: 'Lause 1 / 8' } };

export const Last: Story = { args: { current: 7, label: 'Lause 8 / 8' } };

export const Complete: Story = {
  args: { current: 8, label: 'Lause 8 / 8 · valmis' },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar');
    await expect(bar.querySelectorAll('[data-state="done"]')).toHaveLength(8);
    await expect(bar.querySelectorAll('[data-state="current"]')).toHaveLength(0);
  },
};

export const Exam: Story = { args: { total: 24, current: 11, label: 'Küsimus 12 / 24' } };

export const Dark: Story = { globals: { theme: 'dark' } };
