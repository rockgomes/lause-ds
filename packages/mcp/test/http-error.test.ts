import { describe, it, expect, vi } from 'vitest';

/**
 * The error boundary in the Netlify function, proved by making the one thing
 * it wraps fail: the transport handles a malformed request itself (see
 * http.test.ts), so nothing short of a thrown error reaches the `catch`.
 */
vi.mock('lause-ds-mcp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lause-ds-mcp')>();
  return {
    ...actual,
    buildServer: () => {
      throw new Error('boom: /Users/someone/secret/path.ts');
    },
  };
});

const { default: handler } = await import('../../../netlify/functions/mcp.ts');

describe('netlify mcp function error boundary', () => {
  it('answers 500 with a JSON-RPC internal error and no detail', async () => {
    const response = await handler(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      }),
      {} as never,
    );

    const text = await response.text();
    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-max-age')).toBe('86400');
    expect(JSON.parse(text)).toEqual({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null });
    expect(text).not.toMatch(/boom|secret|\.ts/);
  });
});
