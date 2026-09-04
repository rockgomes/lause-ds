import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Sentence, type SentenceProps, type Segment } from './Sentence.js';
import { restFocus } from '../test-utils.js';

const segments: Segment[] = [
  'Riigikogusse võib ',
  { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate' },
  ' iga vähemalt kahekümne ühe aastane ',
  { id: 'haaleoiguslik', text: 'hääleõiguslik', gloss: 'with the right to vote' },
  ' Eesti ',
  { id: 'kodanik', text: 'kodanik', gloss: 'citizen' },
  '.',
];

function Controlled(props: SentenceProps) {
  const [pinned, setPinned] = useState<string[]>([...props.pinned]);
  const [counts, setCounts] = useState<Record<string, number>>({ ...props.counts });
  return (
    <Sentence
      {...props}
      pinned={pinned}
      counts={counts}
      onToggle={(id) => {
        props.onToggle(id);
        if (pinned.includes(id)) setPinned(pinned.filter((p) => p !== id));
        else {
          setPinned([...pinned, id]);
          setCounts({ ...counts, [id]: (counts[id] ?? 0) + 1 });
        }
      }}
    />
  );
}

const meta = {
  title: 'Sentence',
  component: Sentence,
  render: (args) => <Controlled {...args} />,
  args: {
    segments,
    previous: 'Riigikogu liikmed valitakse vabadel valimistel proportsionaalsuse põhimõtte alusel.',
    next: 'Riigikogu liikmete valimise korra sätestab Riigikogu valimise seadus.',
    support: 'tugi',
    pinned: [],
    counts: {},
    onToggle: fn(),
    label: 'Lause 5 / 8',
  },
} satisfies Meta<typeof Sentence>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tugi: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Lause 5 / 8' });
    const terms = within(region).getAllByRole('button');
    await expect(terms).toHaveLength(3);
    await expect(terms[0]).toHaveAttribute('data-state', 'idle');
    await expect(canvas.queryByRole('note')).toBeNull();

    await userEvent.click(terms[0]);
    await expect(args.onToggle).toHaveBeenLastCalledWith('kandideerida');
    await expect(terms[0]).toHaveAttribute('aria-pressed', 'true');
    await expect(terms[0]).toHaveAttribute('data-state', 'pinned');
    const note = canvas.getByRole('note');
    await expect(note).toHaveTextContent('to stand as a candidate');
    await expect(note).toHaveTextContent('×1');
    await expect(terms[0]).toHaveAttribute('aria-describedby', note.id);
    await expect(terms[0]).toHaveAccessibleName('kandideerida');

    await userEvent.click(terms[0]);
    await expect(terms[0]).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.queryByRole('note')).toBeNull();
    restFocus();
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const terms = within(canvasElement).getAllByRole('button');
    terms[1].focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onToggle).toHaveBeenLastCalledWith('haaleoiguslik');
    await expect(terms[1]).toHaveAttribute('aria-pressed', 'true');
    restFocus();
  },
};

export const TwoPins: Story = {
  args: { pinned: ['kandideerida', 'haaleoiguslik'], counts: { kandideerida: 1, haaleoiguslik: 3 }, notes: { haaleoiguslik: '→ kordamisse' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('note')).toHaveLength(2);
  },
};

export const Peeking: Story = {
  args: { peeking: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('note')).toHaveLength(3);
    for (const t of canvas.getAllByRole('button')) await expect(t).toHaveAttribute('data-state', 'peeked');
  },
};

export const EestiKeeles: Story = {
  args: { support: 'et' },
  play: async ({ canvasElement }) => {
    const terms = within(canvasElement).getAllByRole('button');
    await expect(terms).toHaveLength(3);
    await expect(terms[0]).toHaveAttribute('data-marked', 'false');
  },
};

export const Korvuti: Story = {
  args: {
    support: 'korvuti',
    english: 'Every Estonian citizen who has the right to vote and has attained twenty-one years of age may stand as a candidate for the Riigikogu.',
    englishNote: 'mitteametlik tõlge · eestikeelne tekst on autoriteetne',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/mitteametlik tõlge/)).toBeVisible();
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { pinned: ['kandideerida'], counts: { kandideerida: 2 }, support: 'korvuti', english: 'Every Estonian citizen who has the right to vote and has attained twenty-one years of age may stand as a candidate for the Riigikogu.', englishNote: 'mitteametlik tõlge · eestikeelne tekst on autoriteetne' },
};
