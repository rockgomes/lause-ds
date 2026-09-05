import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const PROTOCOL_VERSION = '2025-06-18';

type Handler = (req: Request, context: unknown) => Promise<Response>;

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

/**
 * The deployed function is an esbuild bundle, not the TypeScript source
 * vitest runs elsewhere: anything the source reaches for relative to its own
 * file (`../package.json`, a monorepo root, a data file on disk) is gone by
 * then. This bundles the function the way Netlify does and drives the built
 * artefact, so a cold-start failure fails here instead of in production.
 */
describe('the esbuild-bundled Netlify function', () => {
  let outDir: string;
  let handler: Handler;

  beforeAll(async () => {
    outDir = mkdtempSync(join(tmpdir(), 'lause-ds-mcp-bundle-'));
    const outfile = join(outDir, 'mcp.mjs');
    await build({
      entryPoints: [join(repoRoot, 'netlify/functions/mcp.ts')],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node24',
      logLevel: 'silent',
    });
    const module = (await import(pathToFileURL(outfile).href)) as { default: Handler };
    handler = module.default;
  }, 120_000);

  afterAll(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it('serves initialize and get_component from the bundle', async () => {
    const initResponse = await handler(
      request({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: 'bundle-test-client', version: '0.0.0' },
        },
      }),
      {},
    );
    expect(initResponse.status).toBe(200);

    const response = await handler(
      request(
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: { name: 'get_component', arguments: { name: 'Button' } },
        },
        { 'mcp-protocol-version': PROTOCOL_VERSION },
      ),
      {},
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { result: { content: Array<{ text: string }> } };
    expect(body.result.content[0]?.text).toContain('export function Button');
  });
});
