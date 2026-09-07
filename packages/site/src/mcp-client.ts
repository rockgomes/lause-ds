/** The four tools `netlify/functions/mcp.ts` registers (see `packages/mcp/src/server.ts`). */
export type ToolName = 'list_tokens' | 'list_components' | 'get_component' | 'check_usage';

export type ToolResult = { text: string; isError: boolean };

type JsonRpcResponse = {
  result?: { content?: { type: string; text: string }[]; isError?: boolean };
  error?: { code: number; message: string };
};

/**
 * Calls one Lause MCP tool over HTTP, the same protocol Claude Code speaks to the hosted
 * server. The transport is stateless (`sessionIdGenerator: undefined` in `netlify/functions/mcp.ts`),
 * so no session id is kept between the two requests it takes: `initialize`, then `tools/call`.
 *
 * `fetchImpl` defaults to the global `fetch` and exists so tests can supply a mock; the client
 * never sends cookies (`credentials: 'omit'`), every tool here is public, read-only reference
 * data, so there is nothing a cookie could authenticate.
 */
export async function callTool(
  name: ToolName,
  args: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<ToolResult> {
  let nextId = 1;

  const post = async (method: string, params: Record<string, unknown>): Promise<JsonRpcResponse> => {
    const response = await fetchImpl('/mcp', {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as JsonRpcResponse;
    if (body.error) throw new Error(`MCP error ${body.error.code}: ${body.error.message}`);
    return body;
  };

  await post('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'lause-site', version: '0' },
  });

  const { result } = await post('tools/call', { name, arguments: args });
  const text = result?.content?.[0]?.text ?? '';
  return { text, isError: result?.isError ?? false };
}
