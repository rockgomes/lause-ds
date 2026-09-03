import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Bar, type BarSegment } from './Bar.js';

const riigikord: BarSegment[] = ['retained', 'retained', 'retained', 'retained', 'covered', 'covered', 'unread', 'unread', 'unread', 'unread'];

const meta = {
  title: 'Bar',
  component: Bar,
  args: { segments: riigikord, label: 'Riigikord: 4 kinnistunud, 2 loetud, 4 lugemata, kokku 10' },
} satisfies Meta<typeof Bar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Domain: Story = {
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('img', { name: /Riigikord/ });
    await expect(bar.querySelectorAll('[data-segment="retained"]')).toHaveLength(4);
    await expect(bar.querySelectorAll('[data-segment="covered"]')).toHaveLength(2);
    await expect(bar.querySelectorAll('[data-segment="unread"]')).toHaveLength(4);
  },
};

export const Untouched: Story = {
  args: { segments: Array.from({ length: 48 }, () => 'unread' as const), label: 'Põhiõigused: 0 kinnistunud, 0 loetud, 48 lugemata, kokku 48' },
};

export const Rows: Story = {
  render: (args) => (
    <dl className="flex max-w-[640px] flex-col gap-16">
      {[
        ['Riigikord', riigikord],
        ['Põhiõigused', Array.from({ length: 48 }, (_, i) => (i < 20 ? 'retained' : i < 31 ? 'covered' : 'unread') as BarSegment)],
      ].map(([name, segments]) => (
        <div key={name as string} className="flex flex-col gap-4">
          <dt className="text-label text-dim">{name as string}</dt>
          <dd>
            <Bar {...args} segments={segments as BarSegment[]} label={`${name as string}: ${(segments as BarSegment[]).length} paragrahvi`} />
          </dd>
        </div>
      ))}
    </dl>
  ),
};

export const Dark: Story = { globals: { theme: 'dark' }, render: Rows.render };
