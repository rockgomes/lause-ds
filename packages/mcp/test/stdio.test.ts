import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const distStdio = `${packageRoot}dist/stdio.js`;

beforeAll(() => {
  execSync('npm run build:mcp', { cwd: repoRoot, stdio: 'ignore' });
}, 120_000);

describe.skipIf(!existsSync(distStdio))('stdio entry', () => {
  it('serves list_components with 13 entries over stdio', async () => {
    const client = new Client({ name: 'lause-ds-mcp-test-client', version: '0.0.0' });
    const transport = new StdioClientTransport({ command: 'node', args: [distStdio] });
    await client.connect(transport);
    try {
      const result = await client.callTool({ name: 'list_components', arguments: {} });
      const content = result.content as Array<{ type: string; text: string }>;
      const { components } = JSON.parse(content[0]!.text) as { components: unknown[] };
      expect(components).toHaveLength(13);
    } finally {
      await client.close();
    }
  });
});
