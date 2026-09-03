import type { Meta, StoryObj } from '@storybook/react-vite';

const colours = ['ground', 'ink', 'dim', 'accent', 'accent-text', 'accent-on-ink', 'surface', 'on-ink'] as const;
const roles = ['label', 'body', 'title', 'reading', 'headline', 'display'] as const;

function Tokens() {
  return (
    <div className="flex flex-col gap-32">
      <ul className="flex flex-wrap gap-16" aria-label="Semantic colours">
        {colours.map((name) => (
          <li key={name} className="flex flex-col items-center gap-4">
            <span
              aria-hidden="true"
              className="block h-48 w-48 rounded-card border-[1.5px] border-ink"
              style={{ background: `var(--lause-color-${name})` }}
            />
            <code className="text-label">{name}</code>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-12">
        {roles.map((role) => (
          <div key={role} className="flex items-baseline gap-16">
            <dt className="w-96 shrink-0 text-label text-dim">{role}</dt>
            <dd className={`text-${role} ${role === 'label' || role === 'body' || role === 'title' ? 'font-chrome' : 'font-content'}`}>
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

export const Light: Story = {};
export const Dark: Story = { globals: { theme: 'dark' } };
