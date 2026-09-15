import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

const colours = [
  'ground',
  'ink',
  'dim',
  'accent',
  'accent-text',
  'accent-on-ink',
  'surface',
  'on-ink',
  'ink-hover',
  'ink-active',
  'ground-hover',
  'surface-hover',
  'accent-text-on-ink',
] as const;
const roles = [
  { name: 'label', cls: 'text-label font-chrome' },
  { name: 'body', cls: 'text-body font-chrome' },
  { name: 'title', cls: 'text-title font-chrome' },
  { name: 'reading', cls: 'text-reading font-content' },
  { name: 'headline', cls: 'text-headline font-content' },
  { name: 'display', cls: 'text-display font-content' },
] as const;

function Tokens() {
  return (
    <div className="flex flex-col gap-32">
      <ul className="flex flex-wrap gap-16" aria-label="Semantic colours">
        {colours.map((name) => (
          <li key={name} className="flex flex-col items-center gap-4">
            <span
              aria-hidden="true"
              className="block h-48 w-48 rounded-card border-(length:--lause-stroke-thin) border-ink"
              style={{ background: `var(--lause-color-${name})` }}
            />
            <code className="text-label">{name}</code>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-12">
        {roles.map((role) => (
          <div key={role.name} className="flex items-baseline gap-16">
            <dt className="w-96 shrink-0 text-label text-dim">{role.name}</dt>
            <dd data-role={role.name} className={role.cls}>
              Igaühel on õigus vabalt liikuda
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const meta = { title: 'Tokens', component: Tokens } satisfies Meta<typeof Tokens>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reading = canvas.getByText('Igaühel on õigus vabalt liikuda', { selector: '[data-role="reading"]' });
    const headline = canvas.getByText('Igaühel on õigus vabalt liikuda', { selector: '[data-role="headline"]' });
    const display = canvas.getByText('Igaühel on õigus vabalt liikuda', { selector: '[data-role="display"]' });
    await expect(getComputedStyle(reading).fontSize).toBe('57px');
    await expect(getComputedStyle(display).fontSize).toBe('143px');
    await expect(getComputedStyle(headline).fontWeight).toBe('700');
  },
};
export const Dark: Story = { globals: { theme: 'dark' } };
