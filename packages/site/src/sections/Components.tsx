import { clsx } from 'clsx';
import { componentDocs, type ComponentDoc } from '../data/manifest.js';
import { EXAMPLES } from './examples.js';
import { focusRing } from '../styles.js';

// The Sentence, Nav and CellGrid cards span both columns on desktop — their components are wide
// (Sentence maxes at 1020px, Nav is a full header row, CellGrid is a 2×2 table) — the other ten
// sit two per row (ruling, Rock 2026-09-05).
const WIDE: ReadonlySet<string> = new Set(['Sentence', 'Nav', 'CellGrid']);

// Nav (a fixed three-column header row), CellGrid (a table) and Bubble ("kandideerida" set at
// `text-reading`) don't shrink to fit a phone-width card the way wrapping text does; their
// example scrolls horizontally inside its own box instead of forcing the page wider. Everything
// else — including Sentence, whose text wraps once its example box has a real width (`w-full`
// below) — needs no such escape hatch.
const SCROLLS: ReadonlySet<string> = new Set(['Nav', 'CellGrid', 'Bubble']);

function LinkRow({ doc }: { doc: ComponentDoc }) {
  return (
    <p className="text-label">
      <a href={doc.storybookUrl} className={clsx('rounded-control', focusRing)}>
        Storybook ↗
      </a>
      {doc.figmaUrl ? (
        <>
          {' · '}
          <a href={doc.figmaUrl} className={clsx('rounded-control', focusRing)}>
            Figma ↗
          </a>
        </>
      ) : null}
      {' · '}
      <a href={doc.sourceUrl} className={clsx('rounded-control', focusRing)}>
        Source ↗
      </a>
    </p>
  );
}

function Card({ doc }: { doc: ComponentDoc }) {
  const Example = EXAMPLES[doc.name];
  return (
    // min-w-0: without it a grid item's default "auto" minimum width is its content's min-content
    // size, so one wide example (Nav's header row, CellGrid's table) would force every card that
    // shares its implicit column — i.e. every other card, below the `md:` two-column breakpoint —
    // to that same width, overflowing the page (the classic CSS grid "blowout").
    <article data-component={doc.name} className={clsx('flex min-w-0 flex-col gap-16 rounded-card bg-surface p-24 shadow-tile', WIDE.has(doc.name) && 'md:col-span-2')}>
      {/* tabIndex on the SCROLLS members only: axe's scrollable-region-focusable rule requires a
          scrollable region to be reachable by keyboard when its content isn't already focusable. */}
      <div
        tabIndex={SCROLLS.has(doc.name) ? 0 : undefined}
        role={SCROLLS.has(doc.name) ? 'group' : undefined}
        aria-label={SCROLLS.has(doc.name) ? `${doc.name} example` : undefined}
        className={clsx('flex w-full items-center rounded-bubble bg-ground p-24', SCROLLS.has(doc.name) ? 'justify-start overflow-x-auto' : 'justify-center')}
      >
        {/* w-full min-w-0: without a definite width, a w-full example (Progress, Bar) collapses to
            0; min-w-0 is a flex item's own shrink-to-fit override so Sentence's line of text — the
            one example that needs to wrap, not scroll — can shrink below its content width on a
            phone. The SCROLLS members (Nav, CellGrid, Bubble) don't shrink to fit a phone-width
            card at all, so they're shrink-0 and scroll inside overflow-x-auto instead of squeezing. */}
        <div className={SCROLLS.has(doc.name) ? 'mx-auto shrink-0' : 'w-full min-w-0'}>
          <Example />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="font-chrome text-title">{doc.name}</h3>
        <p className="text-body">{doc.summary}</p>
      </div>
      <p className="text-label text-dim">Proof: {doc.proofScreen}</p>
      <LinkRow doc={doc} />
    </article>
  );
}

/** The Components gallery: one card per manifest entry, in manifest order, each a live example. */
export function Components() {
  return (
    <div className="flex flex-col gap-24">
      <h2 id="components-title" className="break-words font-content text-headline-narrow sm:text-headline">
        Components
      </h2>
      <div className="grid gap-24 md:grid-cols-2">
        {componentDocs().map((doc) => (
          <Card key={doc.name} doc={doc} />
        ))}
      </div>
    </div>
  );
}
