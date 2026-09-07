import { describe, expect, it, vi } from 'vitest';
import { callTool } from '../src/mcp-client.js';

describe('callTool', () => {
  it('posts initialize then tools/call and returns the text', async () => {
    const calls: unknown[] = [];
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      calls.push(body.method);
      const result =
        body.method === 'initialize'
          ? { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'lause-ds', version: '0' } }
          : { content: [{ type: 'text', text: '{"findings":[]}' }] };
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }), { headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;
    const out = await callTool('check_usage', { code: '<div/>' }, fetchImpl);
    expect(calls).toEqual(['initialize', 'tools/call']);
    expect(out).toEqual({ text: '{"findings":[]}', isError: false });
  });

  it('rejects on a non-200', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch;
    await expect(callTool('list_tokens', {}, fetchImpl)).rejects.toThrow(/500/);
  });
});
