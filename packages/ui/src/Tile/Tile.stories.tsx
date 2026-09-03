import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Tile, TileStack } from './Tile.js';

const options = [
  'Riigikogu',
  'Vabariigi President',
  'Vabariigi Valitsus',
  'Riigikohus',
];

const meta = {
  title: 'Tile',
  component: Tile,
  args: { children: 'Vabariigi President', keycap: '2', onClick: fn() },
} satisfies Meta<typeof Tile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  play: async ({ canvasElement, args }) => {
    const tile = within(canvasElement).getByRole('button', { name: /Vabariigi President/ });
    await expect(tile).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(tile);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Selected: Story = {
  args: { state: 'selected' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Filled: Story = { args: { state: 'filled' } };

export const Dimmed: Story = { args: { state: 'dimmed' } };

export const Stack: Story = {
  render: (args) => (
    <TileStack aria-label="Vali õige vastus">
      {options.map((option, i) => (
        <Tile {...args} key={option} keycap={String(i + 1)} state={i === 1 ? 'selected' : 'idle'}>
          {option}
        </Tile>
      ))}
    </TileStack>
  ),
  play: async ({ canvasElement, args }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Vali õige vastus' });
    const tiles = within(group).getAllByRole('button');
    await expect(tiles).toHaveLength(4);
    await userEvent.click(tiles[3]);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const TrueFalse: Story = {
  render: (args) => (
    <div className="flex max-w-[640px] gap-12">
      <Tile {...args} keycap="1" className="justify-center text-center">õige</Tile>
      <Tile {...args} keycap="2" className="justify-center text-center">vale</Tile>
    </div>
  ),
};

export const Dark: Story = { args: { state: 'selected' }, globals: { theme: 'dark' } };
