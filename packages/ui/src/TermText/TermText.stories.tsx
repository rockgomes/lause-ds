import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TermText, type TermTextProps } from './TermText.js';
import type { Segment } from '../Term/Term.js';
import { restFocus } from '../test-utils.js';

const segments: Segment[] = [
  'Riigikogu ',
  { id: 'valima', text: 'valib', gloss: 'elects' },
  ' Vabariigi Presidendi ',
  { id: 'salajane', text: 'salajasel', gloss: 'secret' },
  ' ',
  { id: 'haaletus', text: 'hääletusel', gloss: 'vote' },
  '.',
];

const shared: Segment[] = [
  'Iga Eesti ',
  { id: 'kodanik', text: 'kodanik', gloss: 'citizen' },
  ' vastutab teise Eesti ',
  { id: 'kodanik', text: 'kodaniku', gloss: 'citizen' },
  ' ees.',
];

function Controlled(props: TermTextProps) {
  const [pinned, setPinned] = useState<string[]>([...props.pinned]);
  const [counts, setCounts] = useState<Record<string, number>>({ ...props.counts });
  return (
    <p className="mt-64 font-chrome text-body text-ink">
      <TermText
        {...props}
        pinned={pinned}
        counts={counts}
        onToggle={(id) => {
          props.onToggle(id);
          if (pinned.includes(id)) setPinned(pinned.filter((p) => p !== id));
          else { setPinned([...pinned, id]); setCounts({ ...counts, [id]: (counts[id] ?? 0) + 1 }); }
        }}
      />
    </p>
  );
}

const meta = {
  title: 'TermText',
  component: TermText,
  args: { segments, size: 'body', support: 'tugi', pinned: [], counts: {}, onToggle: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof TermText>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tugi: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const p = canvasElement.querySelector('p')!;
    await expect(p.textContent).toContain('Riigikogu valib Vabariigi Presidendi salajasel hääletusel.');
    const terms = canvas.getAllByRole('button');
    await expect(terms).toHaveLength(3);
    for (const t of terms) await expect(t).toHaveAttribute('data-marked', 'true');
    await userEvent.click(terms[1]);
    await expect(args.onToggle).toHaveBeenLastCalledWith('salajane');
    await expect(canvas.getByRole('note')).toHaveTextContent('secret');
    const live = canvasElement.querySelector('[aria-live]') as HTMLElement;
    await expect(live).toHaveTextContent('secret');
    restFocus();
  },
};

export const NoLiveRegion: Story = {
  args: { live: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-live]')).toBeNull();
  },
};

export const EestiKeeles: Story = {
  args: { support: 'et' },
  play: async ({ canvasElement }) => {
    for (const t of within(canvasElement).getAllByRole('button')) await expect(t).toHaveAttribute('data-marked', 'false');
  },
};

export const SharedId: Story = {
  name: 'two occurrences that share an id pin together',
  args: { segments: shared },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const terms = canvas.getAllByRole('button');
    await userEvent.click(terms[0]);
    await expect(terms[0]).toHaveAttribute('aria-pressed', 'true');
    await expect(terms[1]).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getAllByRole('note')).toHaveLength(2);
    restFocus();
  },
};

export const NoWrapperElement: Story = {
  name: 'renders inline, no element of its own around the text',
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector('p')!;
    // Children of the caller's <p>: text spans, term spans and the live region; no block wrapper.
    for (const child of Array.from(p.children)) await expect(child.tagName).toBe('SPAN');
  },
};
