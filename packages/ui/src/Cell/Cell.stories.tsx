import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Cell, CellGrid } from './Cell.js';
import { restFocus } from '../test-utils.js';

const meta = {
  title: 'Cell',
  component: Cell,
  args: { subject: 'Igaüks', verdict: 'tohib piirata', keycap: '1', onClick: fn() },
} satisfies Meta<typeof Cell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  play: async ({ canvasElement, args }) => {
    const cell = within(canvasElement).getByRole('button', { name: /Igaüks/ });
    await expect(cell).toHaveAttribute('data-state', 'idle');
    await userEvent.click(cell);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    restFocus();
  },
};

export const Selected: Story = { args: { state: 'selected', verdict: 'ei tohi piirata', keycap: '2' } };

export const Filled: Story = {
  args: { state: 'filled' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Dimmed: Story = {
  args: { state: 'dimmed' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  },
};

export const Grid: Story = {
  render: (args) => (
    <CellGrid rows={['Igaüks', 'Eesti kodanik']} columns={['Tohib piirata', 'Ei tohi piirata · § 130']} label="Õigused">
      <Cell {...args} subject="Igaüks" verdict="tohib piirata" keycap="1" />
      <Cell {...args} subject="Igaüks" verdict="ei tohi piirata" keycap="2" state="selected" />
      <Cell {...args} subject="Eesti kodanik" verdict="tohib piirata" keycap="3" />
      <Cell {...args} subject="Eesti kodanik" verdict="ei tohi piirata" keycap="4" />
    </CellGrid>
  ),
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole('table', { name: 'Õigused' });
    await expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    await expect(within(table).getAllByRole('rowheader')).toHaveLength(2);
    await expect(within(table).getAllByRole('button')).toHaveLength(4);
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <CellGrid rows={['Igaüks', 'Eesti kodanik']} columns={['Tohib piirata', 'Ei tohi piirata · § 130']} label="Õigused">
      <Cell {...args} subject="Igaüks" verdict="tohib piirata" keycap="1" />
      <Cell {...args} subject="Igaüks" verdict="ei tohi piirata" keycap="2" state="selected" />
      <Cell {...args} subject="Eesti kodanik" verdict="tohib piirata" keycap="3" state="filled" />
      <Cell {...args} subject="Eesti kodanik" verdict="ei tohi piirata" keycap="4" state="dimmed" />
    </CellGrid>
  ),
};
