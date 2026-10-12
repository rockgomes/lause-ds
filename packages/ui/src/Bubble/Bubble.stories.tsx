import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Bubble } from './Bubble.js';

/** A word with a bubble above it, the way Sentence uses it. */
function Word({ children, bubble }: { children: string; bubble: ReactNode }) {
  return (
    <p className="mt-64 font-content text-reading">
      <span className="relative">
        {children}
        {bubble}
      </span>
    </p>
  );
}

const meta = {
  title: 'Bubble',
  component: Bubble,
  args: { children: 'to stand as a candidate', count: 1 },
  render: (args) => <Word bubble={<Bubble {...args} />}>kandideerida</Word>,
} satisfies Meta<typeof Bubble>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pinned: Story = {
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    await expect(note).toHaveTextContent('to stand as a candidate');
    await expect(note).toHaveTextContent('×1');
    const count = note.querySelector('[aria-hidden]');
    await expect(count).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Promoted: Story = { args: { children: 'with the right to vote', count: 3, note: '→ kordamisse' } };

export const NoCount: Story = { args: { count: undefined } };

/**
 * A gloss wider than the word it sits over must render as one line at 640px and up
 * (never covering the line above), and wrap at narrower widths to stay inside the column.
 */
export const LongGloss: Story = {
  args: { children: 'with the right to vote', count: 3 },
  render: (args) => <Word bubble={<Bubble {...args} />}>x</Word>,
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    const style = getComputedStyle(note);
    await expect(style.whiteSpace).toBe('nowrap');
    const lineHeight = Number.parseFloat(style.lineHeight);
    const height = note.getBoundingClientRect().height;
    await expect(height).toBeLessThan(lineHeight * 2);
  },
};

/**
 * At 320px viewport width, the long gloss wraps and stays inside the section's bounds.
 */
export const LongGlossNarrow: Story = {
  args: { children: 'with the right to vote', count: 3 },
  render: (args) => <Word bubble={<Bubble {...args} />}>x</Word>,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    const style = getComputedStyle(note);
    await expect(style.whiteSpace).toBe('normal');
    const section = note.closest('section') || note.closest('p')?.parentElement;
    if (section) {
      const noteBounds = note.getBoundingClientRect();
      const sectionBounds = section.getBoundingClientRect();
      await expect(noteBounds.right).toBeLessThanOrEqual(sectionBounds.right + 1);
    }
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-col gap-32">
      <Word bubble={<Bubble count={1}>to stand as a candidate</Bubble>}>kandideerida</Word>
      <Word bubble={<Bubble count={3} note="→ kordamisse">with the right to vote</Bubble>}>hääleõiguslik</Word>
    </div>
  ),
};

/** At body size (a 16 px panel) the bubble uses body text, so it covers less of the line above. */
export const Body: Story = {
  args: { children: 'secret', count: 2, size: 'body' },
  render: (args) => (
    <p className="mt-64 font-chrome text-body">
      <span className="relative">
        salajasel
        <Bubble {...args} />
      </span>
    </p>
  ),
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    await expect(getComputedStyle(note).fontSize).toBe('16px');
  },
};

export const TitleByDefault: Story = {
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    await expect(getComputedStyle(note).fontSize).toBe('19px');
  },
};

const longGloss = 'to promulgate (a law); to declare (elections, a state of emergency)';

/** At body size the bubble wraps inside 240 px instead of running across the panel on one line. */
export const BodyWraps: Story = {
  args: { children: longGloss, count: undefined, size: 'body' },
  render: (args) => (
    <p className="mt-128 font-chrome text-body">
      <span className="relative">
        kuulutab
        <Bubble {...args} />
      </span>
    </p>
  ),
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    const style = getComputedStyle(note);
    const rect = note.getBoundingClientRect();
    await expect(rect.width).toBeLessThanOrEqual(240);
    await expect(rect.height).toBeGreaterThan(Number.parseFloat(style.lineHeight) * 1.5);
  },
};

/**
 * Checks a body bubble over a word at one edge of a 280 px panel that clips sideways: the bubble
 * stays inside the panel (8 px margin allowed) and the tail's centre stays over the word's centre.
 */
async function expectInsideWithTailOverWord(canvasElement: HTMLElement) {
  const note = within(canvasElement).getByRole('note');
  const panel = note.closest('p')!;
  const word = note.parentElement!;
  const noteRect = note.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const wordRect = word.getBoundingClientRect();
  await expect(noteRect.left).toBeGreaterThanOrEqual(panelRect.left);
  await expect(noteRect.right).toBeLessThanOrEqual(panelRect.right);
  const tailCentre = noteRect.left + Number.parseFloat(getComputedStyle(note, '::after').left);
  const wordCentre = wordRect.left + wordRect.width / 2;
  await expect(Math.abs(tailCentre - wordCentre)).toBeLessThanOrEqual(2);
}

/** The bubble keeps this far inside its clipping panel, in px (the component's EDGE), less rounding. */
async function expectEightPxMargin(canvasElement: HTMLElement) {
  const note = within(canvasElement).getByRole('note');
  const panel = note.closest('p')!;
  const noteRect = note.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  await expect(noteRect.left).toBeGreaterThanOrEqual(panelRect.left + 8 - 0.5);
  await expect(noteRect.right).toBeLessThanOrEqual(panelRect.right - 8 + 0.5);
}

/** A body bubble over the last word of a line at the right edge of a 280 px panel. */
export const BodyAtRightEdge: Story = {
  args: { children: longGloss, count: undefined, size: 'body' },
  render: (args) => (
    <p className="mt-128 w-[280px] overflow-x-clip text-right font-chrome text-body">
      President{' '}
      <span className="relative">
        kuulutab
        <Bubble {...args} />
      </span>
    </p>
  ),
  play: async ({ canvasElement }) => {
    await expectInsideWithTailOverWord(canvasElement);
    await expectEightPxMargin(canvasElement);
  },
};

/** A body bubble over the first word of a line at the left edge of a 280 px panel. */
export const BodyAtLeftEdge: Story = {
  args: { children: longGloss, count: undefined, size: 'body' },
  render: (args) => (
    <p className="mt-128 w-[280px] overflow-x-clip text-left font-chrome text-body">
      <span className="relative">
        kuulutab
        <Bubble {...args} />
      </span>{' '}
      välja seaduse
    </p>
  ),
  play: async ({ canvasElement }) => {
    await expectInsideWithTailOverWord(canvasElement);
    await expectEightPxMargin(canvasElement);
  },
};

/**
 * At a 320 px viewport a long body gloss stays at most 100vw - 32 px wide and inside the viewport,
 * with an 8 px margin on both sides.
 */
export const BodyNarrowViewport: Story = {
  args: { children: longGloss, count: undefined, size: 'body' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => (
    <p className="mt-128 font-chrome text-body">
      <span className="relative">
        kuulutab
        <Bubble {...args} />
      </span>
    </p>
  ),
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole('note');
    const rect = note.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    await expect(rect.width).toBeLessThanOrEqual(viewport - 32 + 0.5);
    await expect(rect.left).toBeGreaterThanOrEqual(8 - 0.5);
    await expect(rect.right).toBeLessThanOrEqual(viewport - 8 + 0.5);
  },
};

function ReMeasuring(args: { short: string; long: string }) {
  const [long, setLong] = useState(false);
  return (
    <div className="w-[280px]">
      <button type="button" onClick={() => setLong(true)}>
        Long gloss
      </button>
      <p className="mt-128 w-[280px] overflow-x-clip text-right font-chrome text-body">
        President{' '}
        <span className="relative">
          kuulutab
          <Bubble size="body">{long ? args.long : args.short}</Bubble>
        </span>
      </p>
    </div>
  );
}

/** The gloss changes after mount, from short to long: the bubble measures again and stays inside its panel. */
export const BodyReMeasures: Story = {
  render: () => <ReMeasuring short="secret" long={longGloss} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const note = canvas.getByRole('note');
    const widthBefore = note.getBoundingClientRect().width;
    await userEvent.click(canvas.getByRole('button', { name: 'Long gloss' }));
    await expect(note).toHaveTextContent('promulgate');
    const rect = note.getBoundingClientRect();
    await expect(rect.width).toBeGreaterThan(widthBefore);
    await expectEightPxMargin(canvasElement);
  },
};
