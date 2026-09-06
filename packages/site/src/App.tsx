import { Dial, Nav, Progress, type NavItem } from 'lause-ds';
import { Components } from './sections/Components.js';
import { Hero } from './sections/Hero.js';
import { Reader } from './sections/Reader.js';
import { Tokens } from './sections/Tokens.js';
import { useMediaQuery } from './media.js';
import { useSectionProgress } from './scroll-progress.js';
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

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function App() {
  const [theme, setTheme] = useTheme();
  // Below 640px the Nav shows only the context and the colour dial (design frames' phone Nav).
  const narrow = useMediaQuery('(max-width: 639px)');
  const { current, index } = useSectionProgress(SECTION_IDS);

  return (
    <div className="min-h-screen bg-ground font-chrome text-body text-ink">
      {/* The design frames' page side padding — 24px phone, 64px desktop — shared by this wrapper
          and every section's outer edge below. */}
      <div className="px-24 sm:px-64">
        <Nav
          context="Lause"
          label="Site sections"
          items={narrow ? [] : NAV_ITEMS}
          current={current}
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
      </div>
      {/* Bottom-padded by the fixed footer's height so the last section's content never sits
          under the reading-progress bar. */}
      <main className="pb-64">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={s.id === 'story' ? undefined : `${s.id}-title`} className="px-24 sm:px-64 py-64">
            <div className="mx-auto max-w-[1020px]">
              {s.id === 'story' ? (
                <Hero />
              ) : s.id === 'tokens' ? (
                <Tokens />
              ) : s.id === 'components' ? (
                <Components />
              ) : s.id === 'reader' ? (
                <Reader />
              ) : (
                <h2 id={`${s.id}-title`} className="break-words font-content text-headline-narrow sm:text-headline">
                  {s.label}
                </h2>
              )}
            </div>
          </section>
        ))}
      </main>
      <footer className="fixed inset-x-0 bottom-0 bg-ground px-24 pt-16 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-64">
        <Progress total={SECTIONS.length} current={index + 1} label="Reading progress" />
      </footer>
    </div>
  );
}
