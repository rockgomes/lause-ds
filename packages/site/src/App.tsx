import { Dial, Nav, type NavItem } from 'lause-ds';
import { Hero } from './sections/Hero.js';
import { useTheme } from './theme.js';

export const SECTIONS = [
  { id: 'story', label: 'Story' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'components', label: 'Components' },
  { id: 'reader', label: 'Reader' },
  { id: 'ask', label: 'Ask' },
  { id: 'install', label: 'Install' },
] as const;

// The Nav has four item slots; Story is the top of the page and Install is reached from the
// footer (ruling, Rock 2026-09-05 — see figma/library.json "rulings").
const NAV_IDS = new Set(['tokens', 'components', 'reader', 'ask']);

const NAV_ITEMS: NavItem[] = SECTIONS.filter((s) => NAV_IDS.has(s.id)).map((s) => ({
  id: s.id,
  label: s.label,
  labelEn: s.label,
  href: `#${s.id}`,
}));

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function App() {
  const [theme, setTheme] = useTheme();

  return (
    <div className="min-h-screen bg-ground font-chrome text-body text-ink">
      <Nav
        context="Lause"
        label="Site sections"
        items={NAV_ITEMS}
        current="story"
        onNavigate={(id) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })}
        controls={
          <Dial
            label="Colour mode"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        }
      />
      <main>
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={s.id === 'story' ? undefined : `${s.id}-title`} className="mx-auto max-w-[1020px] px-16 py-64">
            {s.id === 'story' ? (
              <Hero />
            ) : (
              <h2 id={`${s.id}-title`} className="font-content text-headline">
                {s.label}
              </h2>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
