import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const distStdio = `${packageRoot}dist/stdio.js`;

// The build itself runs once in the project's globalSetup (test/global-setup.ts).
beforeAll(() => {
  if (!existsSync(distStdio)) {
    throw new Error(`Expected ${distStdio} to exist after npm run build:mcp`);
  }
});

describe('stdio entry', () => {
  it('serves list_components with 15 entries over stdio', async () => {
    const client = new Client({ name: 'lause-ds-mcp-test-client', version: '0.0.0' });
    const transport = new StdioClientTransport({ command: 'node', args: [distStdio] });
    await client.connect(transport);
    try {
      const result = await client.callTool({ name: 'list_components', arguments: {} });
      const content = result.content as Array<{ type: string; text: string }>;
      const { components } = JSON.parse(content[0]!.text) as { components: unknown[] };
      expect(components).toHaveLength(15);
    } finally {
      await client.close();
    }
  });
});
