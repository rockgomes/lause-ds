import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button.js';
import { tokenRgb } from '../test-utils.js';

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

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    // userEvent.hover dispatches synthetic events and does not set the browser's real
    // :hover state in this runner, so the fill is proved via the class list instead.
    const button = within(canvasElement).getByRole('button', { name: /Edasi/ });
    await userEvent.hover(button);
    await expect(button.className).toContain('enabled:hover:bg-ink-hover');
    await expect(button.className).toContain('enabled:active:bg-ink-active');
    await userEvent.unhover(button);
  },
};

export const DisabledNoHover: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: /Edasi/ });
    await userEvent.hover(button);
    await expect(getComputedStyle(button).backgroundColor).toBe(tokenRgb('--lause-color-ink'));
    await userEvent.unhover(button);
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

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-16">
      <Button {...args} variant="filled">Edasi</Button>
      <Button {...args} variant="outline" keycap="←">Tagasi</Button>
      <Button {...args} variant="dim" keycap={undefined}>Peida tõlked · 3</Button>
      <Button {...args} disabled>Edasi</Button>
    </div>
  ),
};
