import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from 'lause-ds';
import library from '../../../../figma/library.json';
import { focusRing } from '../styles.js';

// Minimal local copy of the shape read off `figma/library.json` — see `data/manifest.ts` for the
// same pattern (the site must not depend on the server package, and the manifest's own file
// covers components, not the file key itself).
type Library = { fileKey: string };
const libraryData = library as unknown as Library;

const COMMANDS: readonly { command: string; description: string }[] = [
  { command: 'npm install lause-ds', description: 'the React components and the Tailwind theme' },
  {
    command: 'claude mcp add --transport http lause https://shiny-frangipane-78fc08.netlify.app/mcp',
    description: 'the hosted MCP server, no install',
  },
  { command: 'npx lause-ds-mcp', description: 'the same server over stdio, from npm' },
];

const LINKS: readonly { label: string; href: string }[] = [
  { label: 'GitHub', href: 'https://github.com/rockgomes/lause-ds' },
  { label: 'npm: lause-ds', href: 'https://www.npmjs.com/package/lause-ds' },
  { label: 'npm: lause-ds-mcp', href: 'https://www.npmjs.com/package/lause-ds-mcp' },
  { label: 'Storybook', href: '/storybook/' },
  { label: 'llms.txt', href: '/llms.txt' },
  { label: 'components.manifest.json', href: '/components.manifest.json' },
  { label: 'Figma library', href: `https://www.figma.com/design/${libraryData.fileKey}` },
];

const COPY_RESET_MS = 1500;

function CommandRow({ command, description }: { command: string; description: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const copy = async () => {
    // Older browsers, and any page not served over HTTPS/localhost, have no `navigator.clipboard`
    // at all — the button just does nothing rather than throwing.
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(command);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      // Denied permission, or no secure context — the row simply stays "Copy".
    }
  };

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-4">
        <pre className="font-chrome whitespace-pre-wrap break-all text-body text-ink">
          {command}
        </pre>
        <p className="text-label text-dim">{description}</p>
      </div>
      {/* `aria-live="polite"` on the button itself: the label change from "Copy" to "Copied" is
          announced without a separate sr-only region. */}
      <Button variant="outline" onClick={() => void copy()} aria-live="polite" className="self-start">
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

function LinkRow() {
  return (
    <p className="text-label">
      {LINKS.map((link, i) => (
        <span key={link.label}>
          {i > 0 ? ' · ' : null}
          <a href={link.href} className={clsx('rounded-control', focusRing)}>
            {link.label}
          </a>
        </span>
      ))}
    </p>
  );
}

/** The Install section: three copyable commands, the project's own links, and a closing line. */
export function Install() {
  return (
    <div className="flex flex-col gap-24">
      <h2 id="install-title" className="break-words font-content text-headline-narrow sm:text-headline">
        Install
      </h2>

      <div className="flex max-w-[640px] flex-col gap-24 rounded-card bg-surface p-24 shadow-tile">
        {COMMANDS.map((row) => (
          <CommandRow key={row.command} {...row} />
        ))}
      </div>

      <LinkRow />

      <p className="text-label text-dim">
        Built with the components it documents. Every value on this page is read from the token files at build time.
      </p>
    </div>
  );
}
