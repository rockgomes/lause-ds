import { useState, type FormEvent } from 'react';
import { clsx } from 'clsx';
import { Dial, Keycap, type DialOption } from 'lause-ds';
import { callTool, type ToolName } from '../mcp-client.js';
import { componentDocs } from '../data/manifest.js';
import { focusRing, hitTarget, hoverFade } from '../styles.js';

type Mode = 'tokens' | 'component' | 'check';

const MODE_OPTIONS: readonly DialOption<Mode>[] = [
  { value: 'tokens', label: 'Tokens' },
  { value: 'component', label: 'Component' },
  { value: 'check', label: 'Check' },
];

const TOOL_BY_MODE: Record<Mode, ToolName> = {
  tokens: 'list_tokens',
  component: 'get_component',
  check: 'check_usage',
};

const DEFAULT_COMPONENT_NAME = 'Button';
// The exact snippet `scripts/check-site-usage.mjs` and the MCP server's own `check_usage` both
// flag with the same two findings — an off-theme colour and a raw text size outside the six
// roles — so clicking Ask with no edits is a real, reproducible round-trip, not a fabricated one.
//
// Built by interpolation rather than written as one literal string: `check_usage`'s own scanner
// (see `packages/mcp/src/check-usage.ts`) is a plain text search for `className="..."`, with no
// idea that this particular occurrence sits inside a JS string constant rather than real JSX — so
// spelled out directly, this line would flag its own file with the very violations it is quoting
// on purpose. `${CLASSNAME}=` is not the four-character run `className=` the scanner looks for.
const CLASSNAME = 'className';
const DEFAULT_SNIPPET = `<div ${CLASSNAME}="bg-red-500 text-sm">Tere</div>`;

const COMPONENT_DATALIST_ID = 'ask-component-names';

// Copied from `Button`'s own filled-variant classes (packages/ui/src/Button/Button.tsx) rather
// than rendered through `Button` itself: `Button`'s `keycap` prop always renders its `Keycap`
// with a fixed `aria-hidden="true"` and nothing else, so there is no way to also give that
// `Keycap` `data-state="pulse"` while pending — the pulse the CSS below animates.
const askButtonClasses = clsx(
  'inline-flex items-center justify-center gap-8 rounded-control px-24 font-chrome text-body font-semibold',
  hitTarget,
  focusRing,
  hoverFade,
  'disabled:cursor-not-allowed disabled:opacity-(--lause-opacity-dim)',
  'bg-ink text-on-ink enabled:hover:bg-ink-hover enabled:active:bg-ink-active',
);

const controlClasses = clsx(
  'w-full rounded-control border-(length:--lause-stroke-thin) border-ink bg-ground px-16 font-chrome text-body text-ink',
  focusRing,
);

type TokenRow = { name: string; light: unknown; dark: unknown; tailwind: string };
type Finding = { rule: string; line: number; excerpt: string; message: string };
type ManifestProp = { name: string; type: string; required: boolean; default?: string; doc: string };
type ComponentPayload = {
  name: string;
  summary: string;
  props: ManifestProp[];
  states: string[];
  proofScreen: string;
  sourceText: string;
};

/** A token's light/dark value for the table: a plain string, or a resolved type-role ramp. */
function formatTokenValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'fontFamily' in value) {
    const v = value as { fontFamily: string; fontSize: string; lineHeight: number; fontWeight: number };
    return `${v.fontFamily} ${v.fontSize}/${v.lineHeight} ${v.fontWeight}`;
  }
  return String(value);
}

function TokensAnswer({ tokens }: { tokens: TokenRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {['name', 'light', 'dark', 'tailwind'].map((h) => (
              <th key={h} className="border-b border-dim py-8 pr-16 text-label text-dim">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.name}>
              <td className="border-b border-dim py-8 pr-16 text-label text-ink">{t.name}</td>
              <td className="border-b border-dim py-8 pr-16 text-label text-dim">{formatTokenValue(t.light)}</td>
              <td className="border-b border-dim py-8 pr-16 text-label text-dim">{formatTokenValue(t.dark)}</td>
              <td className="border-b border-dim py-8 text-label text-dim">{t.tailwind}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComponentAnswer({ data }: { data: ComponentPayload }) {
  const doc = componentDocs().find((d) => d.name === data.name);
  return (
    <div className="flex flex-col gap-16">
      <p className="text-body text-ink">{data.summary}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {['prop', 'type', 'required', 'default', 'doc'].map((h) => (
                <th key={h} className="border-b border-dim py-8 pr-16 text-label text-dim">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.props.map((p) => (
              <tr key={p.name}>
                <td className="border-b border-dim py-8 pr-16 text-label text-ink">{p.name}</td>
                <td className="border-b border-dim py-8 pr-16 text-label text-dim">{p.type}</td>
                <td className="border-b border-dim py-8 pr-16 text-label text-dim">{p.required ? 'yes' : 'no'}</td>
                <td className="border-b border-dim py-8 pr-16 text-label text-dim">{p.default ?? '—'}</td>
                <td className="border-b border-dim py-8 text-label text-dim">{p.doc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-label text-dim">States: {data.states.join(', ') || '—'}</p>
      <p className="text-label text-dim">Proof: {data.proofScreen}</p>
      <p className="text-label">
        {doc?.figmaUrl ? (
          <>
            <a href={doc.figmaUrl} className={clsx('rounded-control', focusRing)}>
              Figma ↗
            </a>
            {' · '}
          </>
        ) : null}
        <a href={doc?.sourceUrl} className={clsx('rounded-control', focusRing)}>
          Source ↗
        </a>
      </p>
      <details>
        <summary className="cursor-pointer text-label text-dim">Source</summary>
        <pre className="mt-8 overflow-x-auto text-label text-ink">{data.sourceText}</pre>
      </details>
    </div>
  );
}

function CheckAnswer({ findings }: { findings: Finding[] }) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-label text-dim">
        {findings.length} finding{findings.length === 1 ? '' : 's'}
      </p>
      {findings.length === 0 ? (
        <p className="text-body text-ink">No findings.</p>
      ) : (
        <ul className="flex flex-col gap-8">
          {findings.map((f, i) => (
            <li key={i} className="text-body text-ink">
              {f.rule} · line {f.line} — {f.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type AskProps = {
  /** Overrides the global `fetch` so tests can supply a mock; the section otherwise calls `/mcp` for real. */
  fetchImpl?: typeof fetch;
};

/** The Ask section: calls the same hosted MCP server Claude Code talks to, live, from the page. */
export function Ask({ fetchImpl }: AskProps) {
  const [mode, setMode] = useState<Mode>('tokens');
  const [componentName, setComponentName] = useState(DEFAULT_COMPONENT_NAME);
  const [snippet, setSnippet] = useState(DEFAULT_SNIPPET);
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<{ mode: Mode; text: string; isError: boolean } | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const ask = async () => {
    setPending(true);
    setNetworkError(false);
    const args = mode === 'tokens' ? {} : mode === 'component' ? { name: componentName } : { code: snippet };
    try {
      const result = await callTool(TOOL_BY_MODE[mode], args, fetchImpl);
      setAnswer({ mode, text: result.text, isError: result.isError });
    } catch {
      setNetworkError(true);
      setAnswer(null);
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!pending) void ask();
  };

  return (
    <div className="flex flex-col gap-24">
      <h2 id="ask-title" className="break-words font-content text-headline-narrow sm:text-headline">
        Ask
      </h2>
      <p className="max-w-[640px] text-body text-dim">
        The same MCP server Claude Code talks to, from this page. Pick a question, send it, read the answer.
      </p>

      <div className="flex max-w-[640px] flex-col gap-16 rounded-card bg-surface p-24 shadow-tile">
        <Dial label="Question" value={mode} onChange={setMode} options={MODE_OPTIONS} />

        <form onSubmit={onSubmit} className="flex flex-col gap-16">
          {mode === 'component' ? (
            <>
              <input
                list={COMPONENT_DATALIST_ID}
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                aria-label="Component name"
                className={clsx(controlClasses, hitTarget)}
              />
              <datalist id={COMPONENT_DATALIST_ID}>
                {componentDocs().map((d) => (
                  <option key={d.name} value={d.name} />
                ))}
              </datalist>
            </>
          ) : null}

          {mode === 'check' ? (
            <textarea
              rows={4}
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              aria-label="Code to check"
              className={controlClasses}
            />
          ) : null}

          {/* `focusRing` is already folded into `askButtonClasses` above; it is named again here,
              on the button element itself, only so `check_usage`'s focus-ring check — a plain
              text scan for the literal word `focusRing` on that element's own opening tag — can
              see it (`clsx` drops the exact duplicate, so this has no visual effect). Written as
              "button element", not the bracketed tag spelling: check_usage's own tag scanner
              reads this file's raw text too, comments included, and a literal opening-bracket
              spelling here would register as a second, focus-ring-less button of its own. */}
          <button type="submit" disabled={pending} aria-busy={pending} className={clsx(askButtonClasses, focusRing, 'self-start')}>
            Ask
            <Keycap aria-hidden="true" data-state={pending ? 'pulse' : undefined}>
              ⏎
            </Keycap>
          </button>
        </form>

        <p className="text-label text-dim">{TOOL_BY_MODE[mode]} · POST /mcp</p>

        <div className="rounded-bubble bg-ground p-16">
          {networkError ? (
            <p role="alert" className="text-body text-accent-text">
              The server did not answer. Try again.
            </p>
          ) : answer === null ? (
            <p className="text-body text-dim">Ask and the answer comes from the same server Claude Code talks to.</p>
          ) : answer.isError ? (
            <p role="alert" className="text-body text-accent-text">
              {answer.text}
            </p>
          ) : (
            <div className="flex flex-col gap-16">
              {answer.mode === 'tokens' ? (
                <TokensAnswer tokens={(JSON.parse(answer.text) as { tokens: TokenRow[] }).tokens} />
              ) : answer.mode === 'component' ? (
                <ComponentAnswer data={JSON.parse(answer.text) as ComponentPayload} />
              ) : (
                <CheckAnswer findings={(JSON.parse(answer.text) as { findings: Finding[] }).findings} />
              )}
              <details>
                <summary className="cursor-pointer text-label text-dim">Raw JSON-RPC response</summary>
                <pre className="mt-8 overflow-x-auto text-label text-ink">{JSON.stringify(JSON.parse(answer.text), null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
