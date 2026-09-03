import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Dial, type DialProps } from './Dial.js';

type Support = 'et' | 'tugi' | 'korvuti';
const support = [
  { value: 'et', label: 'Eesti keeles' },
  { value: 'tugi', label: 'Tugi' },
  { value: 'korvuti', label: 'Kõrvuti' },
] as const satisfies readonly { value: Support; label: string }[];

function Controlled(props: DialProps<Support>) {
  const [value, setValue] = useState<Support>(props.value);
  return (
    <Dial
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
}

const meta = {
  title: 'Dial',
  component: Dial,
  render: (args) => <Controlled {...(args as DialProps<Support>)} />,
  args: { options: support, value: 'et', label: 'Tugi', onChange: fn() },
} satisfies Meta<typeof Dial>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Support: Story = {
  play: async ({ canvasElement, args }) => {
    const group = within(canvasElement).getByRole('radiogroup', { name: 'Tugi' });
    const radios = within(group).getAllByRole('radio');
    await expect(radios).toHaveLength(3);
    await expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    await expect(radios[1]).toHaveAttribute('tabindex', '-1');

    await userEvent.click(radios[1]);
    await expect(args.onChange).toHaveBeenLastCalledWith('tugi');
    await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const radios = within(canvasElement).getAllByRole('radio');
    radios[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith('tugi');
    await expect(radios[1]).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(args.onChange).toHaveBeenLastCalledWith('korvuti');
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith('et');
  },
};

export const TwoPositions: Story = {
  args: { options: [{ value: 'uuri', label: 'Uuri' }, { value: 'koosta', label: 'Koosta' }], value: 'uuri', label: 'Režiim' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'tugi' },
  play: async ({ canvasElement, args }) => {
    const radios = within(canvasElement).getAllByRole('radio');
    await userEvent.click(radios[2]);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const Dark: Story = { args: { value: 'korvuti' }, globals: { theme: 'dark' } };
