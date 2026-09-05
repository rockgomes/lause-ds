import { describe, it, expect } from 'vitest';
import handler, { config } from '../../../netlify/functions/mcp.ts';

const PROTOCOL_VERSION = '2025-06-18';

function request(body: unknown, extraHeaders: Record<string, string> = {}): Request {
  return new Request('http://localhost/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

describe('netlify mcp function', () => {
  it('exposes the four tools over an initialize + tools/list exchange', async () => {
    const initResponse = await handler(
      request({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: 'http-test-client', version: '0.0.0' },
        },
      }),
      {} as never,
    );
    expect(initResponse.status).toBe(200);
    expect(initResponse.headers.get('access-control-allow-origin')).toBe('*');
    const initBody = (await initResponse.json()) as { result: { protocolVersion: string } };
    expect(initBody.result.protocolVersion).toBe(PROTOCOL_VERSION);

    const listResponse = await handler(
      request(
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
        { 'mcp-protocol-version': PROTOCOL_VERSION },
      ),
      {} as never,
    );
    expect(listResponse.status).toBe(200);
    expect(listResponse.headers.get('access-control-allow-origin')).toBe('*');
    const listBody = (await listResponse.json()) as { result: { tools: Array<{ name: string }> } };
    expect(listBody.result.tools).toHaveLength(4);
    expect(listBody.result.tools.map((tool) => tool.name).sort()).toEqual([
      'check_usage',
      'get_component',
      'list_components',
      'list_tokens',
    ]);
  });

  it('answers OPTIONS with 204 and the CORS headers', async () => {
    const response = await handler(new Request('http://localhost/mcp', { method: 'OPTIONS' }), {} as never);
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
  });

  it('rejects GET with 405', async () => {
    const response = await handler(new Request('http://localhost/mcp', { method: 'GET' }), {} as never);
    expect(response.status).toBe(405);
  });

  it('routes at /mcp', () => {
    expect(config.path).toBe('/mcp');
  });
});
