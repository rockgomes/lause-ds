import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button.js';

const meta = {
  title: 'Button',
  component: Button,
  args: { children: 'Edasi', keycap: '↵', onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: /Edasi/ });
    await expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Outline: Story = { args: { variant: 'outline', children: 'Tagasi', keycap: '←' } };

export const Dim: Story = { args: { variant: 'dim', children: 'Peida tõlked · 3', keycap: undefined } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: /Edasi/ });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Bar: Story = {
  render: (args) => (
    <div className="flex items-center justify-between gap-16">
      <Button {...args} variant="outline" keycap="←">Tagasi</Button>
      <span className="text-label text-dim">Tühik peatab</span>
      <Button {...args}>Edasi</Button>
    </div>
  ),
};

export const Dark: Story = { globals: { theme: 'dark' } };
