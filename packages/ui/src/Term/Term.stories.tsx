import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Term, type TermProps } from './Term.js';
import { restFocus } from '../test-utils.js';

function Controlled(props: TermProps) {
  const [pinned, setPinned] = useState(props.pinned);
  return <Term {...props} pinned={pinned} onToggle={(id) => { props.onToggle(id); setPinned(!pinned); }} />;
}

/** Body size inside a 16 px sans paragraph, the way the app's panels use it. */
function BodyLine(props: TermProps) {
  return (
    <p className="mt-64 font-chrome text-body text-ink">
      Riigikogu valib Vabariigi Presidendi <Controlled {...props} /> hääletusel.
    </p>
  );
}

/** Reading size inside a reading paragraph, the way Sentence uses it. */
function ReadingLine(props: TermProps) {
  return (
    <p className="mt-64 font-content text-reading-narrow sm:text-reading text-ink">
      Riigikogusse võib <Controlled {...props} />.
    </p>
  );
}

const meta = {
  title: 'Term',
  component: Term,
  args: { id: 'salajane', text: 'salajasel', gloss: 'secret', size: 'body', marked: true, pinned: false, count: 1, onToggle: fn() },
  render: (args) => <BodyLine {...args} />,
} satisfies Meta<typeof Term>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The letters' visible top from real font metrics (the same helper as Sentence.stories.tsx). */
function measureLetterTop(term: Element): number {
  const el = term as HTMLElement;
  const style = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = style.font || `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const m = ctx.measureText(el.textContent ?? '');
  const fontBox = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  const halfLeading = (Number.parseFloat(style.lineHeight) - fontBox) / 2;
  return el.getBoundingClientRect().top + halfLeading + (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent);
}

export const BodyIdle: Story = {
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'salajasel' });
    const s = getComputedStyle(term);
    await expect(term).toHaveAttribute('data-size', 'body');
    await expect(term).toHaveAttribute('data-marked', 'true');
    await expect(s.textDecorationLine).toContain('underline');
    await expect(s.textDecorationStyle).toBe('dotted');
    await expect(s.textDecorationThickness).toBe('1.5px');
    await expect(s.textUnderlineOffset).toBe('4px');
    await expect(s.fontSize).toBe('16px');
  },
};

export const BodyPinned: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await userEvent.click(term);
    await expect(args.onToggle).toHaveBeenLastCalledWith('salajane');
    await expect(term).toHaveAttribute('aria-pressed', 'true');
    await expect(term).toHaveAttribute('data-state', 'pinned');
    const s = getComputedStyle(term);
    await expect(s.textDecorationStyle).toBe('solid');
    await expect(s.textDecorationThickness).toBe('3px');
    const note = canvas.getByRole('note');
    await expect(note).toHaveTextContent('secret');
    await expect(note).toHaveTextContent('×1');
    await expect(getComputedStyle(note).fontSize).toBe('16px');
    await expect(term).toHaveAttribute('aria-describedby', note.id);
    restFocus();
  },
};

export const BodyGap: Story = {
  name: 'the body bubble sits above the letters',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await userEvent.click(term);
    const note = canvas.getByRole('note');
    const gap = measureLetterTop(term) - (note.getBoundingClientRect().bottom + 8);
    await expect(gap).toBeGreaterThanOrEqual(0);
    await expect(gap).toBeLessThanOrEqual(16);
    restFocus();
  },
};

export const BodyInheritsFont: Story = {
  name: 'body size keeps the paragraph font',
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'salajasel' });
    const p = term.closest('p')!;
    await expect(getComputedStyle(term).fontFamily).toBe(getComputedStyle(p).fontFamily);
  },
};

export const ReadingIdle: Story = {
  args: { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate', size: 'reading' },
  render: (args) => <ReadingLine {...args} />,
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'kandideerida' });
    const s = getComputedStyle(term);
    await expect(s.textDecorationStyle).toBe('dotted');
    await expect(s.textDecorationThickness).toBe('3px');
    await expect(s.textUnderlineOffset).toBe('4px');
  },
};

export const ReadingPinned: Story = {
  args: { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate', size: 'reading', pinned: true },
  render: (args) => <ReadingLine {...args} />,
  play: async ({ canvasElement }) => {
    const term = within(canvasElement).getByRole('button', { name: 'kandideerida' });
    const s = getComputedStyle(term);
    await expect(s.textDecorationStyle).toBe('solid');
    await expect(s.textDecorationThickness).toBe('4px');
    await expect(getComputedStyle(within(canvasElement).getByRole('note')).fontSize).toBe('19px');
  },
};

export const Unmarked: Story = {
  name: 'unmarked (Eesti keeles): no line, still opens',
  args: { marked: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await expect(term).toHaveAttribute('data-marked', 'false');
    await expect(getComputedStyle(term).textDecorationLine).toBe('none');
    await userEvent.click(term);
    await expect(canvas.getByRole('note')).toHaveTextContent('secret');
    restFocus();
  },
};

export const Peeked: Story = {
  args: { peeking: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const term = canvas.getByRole('button', { name: 'salajasel' });
    await expect(term).toHaveAttribute('data-peeked', 'true');
    await expect(term).toHaveAttribute('data-state', 'idle');
    await expect(canvas.getByRole('note')).toHaveTextContent('secret');
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <div className="flex flex-col gap-24">
      <BodyLine {...args} />
      <BodyLine {...args} pinned />
      <ReadingLine {...args} size="reading" pinned />
    </div>
  ),
};
