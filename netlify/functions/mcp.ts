import type { Config, Context } from '@netlify/functions';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { buildServer } from 'lause-ds-mcp';
import { findRoot, loadData } from 'lause-ds-mcp/data';

// Loaded once at module scope — every request reuses the same in-memory data,
// only the MCP server and transport are built fresh per request (see below).
const data = loadData(findRoot());

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Session-Id',
};

function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * The Lause design system MCP server, hosted as a Netlify Function. No auth —
 * every tool here is read-only reference data (tokens, components, usage
 * rules), so there is nothing to gate.
 */
export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  // Reject anything but POST before it reaches the transport: a GET would
  // make it open an SSE stream that never closes, which a serverless
  // function can't serve.
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  // Fresh server + transport per request — the transport is stateless
  // (sessionIdGenerator: undefined) and explicitly forbids reuse across
  // requests, and a serverless function has no durable place to keep one
  // instance alive between invocations anyway.
  const server = buildServer(data);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);

  const response = await transport.handleRequest(req);
  return withCors(response);
};

export const config: Config = {
  path: '/mcp',
  rateLimit: { windowSize: 60, windowLimit: 120, aggregateBy: ['ip'] },
};
