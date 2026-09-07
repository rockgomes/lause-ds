import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Ask } from '../src/sections/Ask.js';

// The two findings `check_usage` really returns for the prefilled snippet
// (`<div className="bg-red-500 text-sm">Tere</div>`), verified against the built
// `lause-ds-mcp` package while writing `scripts/check-site-usage.mjs`: `bg-red-500` is an
// off-theme colour utility, `text-sm` is a raw text size outside the six roles, both on line 1.
const FINDINGS = [
  { rule: 'off-theme-utility', line: 1, excerpt: '<div className="bg-red-500 text-sm">Tere</div>', message: 'Use a token from the closed theme instead of this off-theme Tailwind utility (see list_tokens)' },
  {
    rule: 'stem-without-role',
    line: 1,
    excerpt: '<div className="bg-red-500 text-sm">Tere</div>',
    message: 'Type is used through the roles: text-label, text-body, text-title, text-reading, text-headline, text-display (and text-reading-narrow, text-headline-narrow below 640px)',
  },
];

/** `gate`, when given, is awaited before the `tools/call` response resolves, lets a test observe the pending state. */
function checkUsageFetchImpl(gate?: Promise<void>) {
  return vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    if (body.method === 'tools/call' && gate) await gate;
    const result =
      body.method === 'initialize'
        ? { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'lause-ds', version: '0' } }
        : { content: [{ type: 'text', text: JSON.stringify({ findings: FINDINGS }) }] };
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }), { headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

describe('Ask section', () => {
  it('Check mode is prefilled with the wrong snippet', async () => {
    const screen = await render(<Ask fetchImpl={checkUsageFetchImpl()} />);
    await screen.getByRole('radio', { name: 'Check' }).click();
    const textarea = screen.container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('<div className="bg-red-500 text-sm">Tere</div>');
  });

  it('clicking Ask shows two findings, disabling the button meanwhile', async () => {
    let openGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const screen = await render(<Ask fetchImpl={checkUsageFetchImpl(gate)} />);
    await screen.getByRole('radio', { name: 'Check' }).click();
    const button = screen.getByRole('button', { name: /Ask/ }).element() as HTMLButtonElement;

    // A native, unawaited click: the locator's own `.click()` refuses to fire without being
    // awaited, but awaiting it here would wait for the whole request, including the pending
    // state this assertion needs to catch, to finish first.
    button.click();
    await expect.element(button).toHaveAttribute('aria-busy', 'true');
    expect(button.disabled).toBe(true);
    expect(button.querySelector('kbd')).not.toBeNull();

    openGate();
    await expect.element(button).not.toBeDisabled();
    expect(screen.container.textContent).toMatch(/off-theme-utility/);
    expect(screen.container.textContent).toMatch(/stem-without-role/);
    expect(screen.container.textContent).toMatch(/line 1/);
  });

  it('shows the alert message when the server does not answer', async () => {
    const fetchImpl = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    const screen = await render(<Ask fetchImpl={fetchImpl} />);
    await screen.getByRole('button', { name: /Ask/ }).click();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('The server did not answer. Try again.');
  });

  it('shows the alert message when the server returns a JSON-RPC error envelope', async () => {
    // A well-formed HTTP 200 response whose body is a JSON-RPC error, not a result, the
    // transport itself never rejects, so `mcp-client.ts` has to notice `body.error` and throw.
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id: body.id, error: { code: -32601, message: 'Method not found' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;
    const screen = await render(<Ask fetchImpl={fetchImpl} />);
    await screen.getByRole('button', { name: /Ask/ }).click();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('The server did not answer. Try again.');
  });

  it('shows the alert message when a tools/call result is not JSON', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const result =
        body.method === 'initialize'
          ? { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'lause-ds', version: '0' } }
          : { content: [{ type: 'text', text: 'not json' }] };
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }), { headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;
    const screen = await render(<Ask fetchImpl={fetchImpl} />);
    await screen.getByRole('button', { name: /Ask/ }).click();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('The server did not answer. Try again.');
  });
});
