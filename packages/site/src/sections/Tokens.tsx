import { clsx } from 'clsx';
import { colourPairs, radii, shadow, typeRoles, type ColourPair } from '../data/tokens.js';

// Tailwind scans the source for literal class strings — these maps exist so every class name
// this file ever renders is written out in full somewhere here, never assembled from a token
// name at runtime (`bg-${key}` would never be picked up by the scanner).
const SWATCH_BG: Record<string, string> = {
  'color.ground': 'bg-ground',
  'color.ink': 'bg-ink',
  'color.dim': 'bg-dim',
  'color.accent': 'bg-accent',
  'color.accent-text': 'bg-accent-text',
  'color.accent-on-ink': 'bg-accent-on-ink',
  'color.accent-text-on-ink': 'bg-accent-text-on-ink',
  'color.surface': 'bg-surface',
  'color.on-ink': 'bg-on-ink',
  'color.ink-hover': 'bg-ink-hover',
  'color.ink-active': 'bg-ink-active',
  'color.ground-hover': 'bg-ground-hover',
  'color.surface-hover': 'bg-surface-hover',
};

const RADIUS_CLASS: Record<string, string> = {
  'radius.control': 'rounded-control',
  'radius.card': 'rounded-card',
  'radius.bubble': 'rounded-bubble',
  'radius.keycap': 'rounded-keycap',
};

const TEXT_ROLE_CLASS: Record<string, string> = {
  label: 'text-label',
  body: 'text-body',
  title: 'text-title',
  reading: 'text-reading',
  headline: 'text-headline',
  display: 'text-display',
  'reading-narrow': 'text-reading-narrow',
  'headline-narrow': 'text-headline-narrow',
};

const FAMILY_CLASS: Record<'content' | 'chrome', string> = {
  content: 'font-content',
  chrome: 'font-chrome',
};

// The family token names, shown as plain text in the caption — never as CSS or a class name, so
// this never trips the raw-font-name check (that check only looks at styling contexts).
const FAMILY_NAME: Record<'content' | 'chrome', string> = {
  content: 'Young Serif',
  chrome: 'Instrument Sans',
};

const LONG_SAMPLE = 'Riigikogu — the parliament';
const SHORT_SAMPLE = 'Riigikogu';
// Design ruling (Rock 2026-09-05): the long sample wraps to three lines at the two largest sizes,
// so display and headline show the bare word instead.
const SHORT_SAMPLE_ROLES = new Set(['display', 'headline']);

function Swatch({ pair }: { pair: ColourPair }) {
  return (
    <div data-swatch className="flex flex-col items-start gap-8">
      <div className={clsx('h-64 w-64 rounded-control', SWATCH_BG[pair.name])} />
      <p className="break-words text-label text-ink">{pair.name}</p>
      <p className="break-words text-label text-dim">light {pair.light}</p>
      <p className="break-words text-label text-dim">dark {pair.dark}</p>
    </div>
  );
}

/** The Tokens section: every semantic colour, every type role and every radius, read live from `src/data/tokens.ts`. */
export function Tokens() {
  const pairs = colourPairs();
  const roles = typeRoles();
  const rad = radii();

  return (
    <div className="flex flex-col gap-48">
      <h2 id="tokens-title" className="break-words font-content text-headline-narrow sm:text-headline">
        Tokens
      </h2>

      <div className="flex flex-col gap-16">
        <p className="text-label text-dim">Light</p>
        <div className="grid grid-cols-2 gap-24 sm:grid-cols-4 lg:grid-cols-7">
          {pairs.map((pair) => (
            <Swatch key={pair.name} pair={pair} />
          ))}
        </div>

        <p className="text-label text-dim">
          Swap the Dial in the top-right; every value on this page comes from the same token files.
        </p>

        {/* The same colours forced into dark mode, regardless of the page's live theme — a fixed
            point of comparison next to the row above, which follows whatever the Dial is set to. */}
        <div data-theme="dark" className="rounded-card bg-ground p-24">
          <p className="mb-16 text-label text-dim">Dark</p>
          <div className="grid grid-cols-2 gap-24 sm:grid-cols-4 lg:grid-cols-7">
            {pairs.map((pair) => (
              <div key={pair.name} aria-hidden="true" className="flex flex-col items-start gap-8">
                <div className={clsx('h-64 w-64 rounded-control', SWATCH_BG[pair.name])} />
                <p className="break-words text-label text-dim">{pair.dark}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-24">
        {roles.map((role) => (
          <div key={role.role} className="flex flex-col gap-4">
            <p
              data-role={role.role}
              className={clsx('break-words', FAMILY_CLASS[role.family], TEXT_ROLE_CLASS[role.role])}
            >
              {SHORT_SAMPLE_ROLES.has(role.role) ? SHORT_SAMPLE : LONG_SAMPLE}
            </p>
            <p className="text-label text-dim">
              {role.role} · {FAMILY_NAME[role.family]} {role.size}/{role.lineHeight} · {role.weight}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-24">
        {rad.map((radius, i) => {
          const isLast = i === rad.length - 1;
          return (
            <div key={radius.name} className="flex flex-col items-start gap-8">
              <div className={clsx('h-64 w-64 bg-surface', RADIUS_CLASS[radius.name], isLast && 'shadow-tile')} />
              <p className="break-words text-label text-dim">
                {radius.name} · {radius.px}px{isLast ? ` · shadow.tile ${shadow()}` : ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
