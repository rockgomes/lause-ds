import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button.js';
import { Dial } from '../Dial/Dial.js';
import { Keycap } from '../Keycap/Keycap.js';
import { Nav, type NavItem } from './Nav.js';
import { restFocus } from '../test-utils.js';

const items: NavItem[] = [
  { id: 'lugeja', label: 'Lugeja', labelEn: 'Reader', href: '#lugeja' },
  { id: 'skeemid', label: 'Skeemid', labelEn: 'Diagrams', href: '#skeemid' },
  { id: 'kordamine', label: 'Kordamine', labelEn: 'Review', href: '#kordamine', count: 14 },
  { id: 'eksam', label: 'Eksam', labelEn: 'Exam', href: '#eksam' },
];

const controls = (
  <>
    <Dial label="Tugi" value="tugi" onChange={() => {}} options={[{ value: 'et', label: 'Eesti keeles' }, { value: 'tugi', label: 'Tugi' }, { value: 'korvuti', label: 'Kõrvuti' }]} />
    <span className="flex items-center gap-8 text-label text-dim">
      <Keycap>⌥</Keycap> piilu
    </span>
  </>
);

const meta = {
  title: 'Nav',
  component: Nav,
  args: { context: '§ 60 · lause 5 / 8', items, current: 'lugeja', controls, label: 'Peamenüü', onNavigate: fn() },
} satisfies Meta<typeof Nav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Reader: Story = {
  play: async ({ canvasElement, args }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Peamenüü' });
    const links = within(nav).getAllByRole('link');
    await expect(links).toHaveLength(4);
    await expect(links[0]).toHaveAttribute('aria-current', 'page');
    await expect(links[2]).toHaveTextContent('Kordamine');
    await expect(links[2]).toHaveTextContent('14');
    await userEvent.click(links[1]);
    await expect(args.onNavigate).toHaveBeenLastCalledWith('skeemid');
    // The Nav hugs its tallest control, here the 48px Dial in `controls`, plus 8px of air above and below.
    const header = canvasElement.querySelector('header')!;
    await expect(header.getBoundingClientRect().height).toBeGreaterThanOrEqual(64);
    restFocus();
  },
};

export const Peeking: Story = {
  args: { peeking: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole('link');
    await expect(links[0]).toHaveTextContent('Reader');
    await expect(links[0]).not.toHaveTextContent('Lugeja');
    await expect(links[2]).toHaveTextContent('Review');
    await expect(canvas.getByRole('list')).toHaveAttribute('lang', 'en');
  },
};

export const Exam: Story = {
  args: { context: 'Eksam · küsimus 12 / 24', items: [], current: undefined, controls: <Button variant="dim">Katkesta eksam</Button> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('link')).toBeNull();
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <div className="flex flex-col gap-24">
      <Nav {...args} peeking />
      {/* A page has one banner landmark; nest the second demo header in a section so it isn't one too. */}
      <section aria-label="Eksami režiim">
        <Nav {...args} context="Eksam · küsimus 12 / 24" items={[]} current={undefined} controls={<Button variant="dim">Katkesta eksam</Button>} />
      </section>
    </div>
  ),
};
