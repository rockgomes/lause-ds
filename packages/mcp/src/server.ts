import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Data } from './data.js';
import { checkUsage } from './check-usage.js';
import { getComponent, listComponents, listTokens } from './tools.js';

const require = createRequire(import.meta.url);
const PKG_VERSION = (require('../package.json') as { version: string }).version;

function json(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}

function errorText(text: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text }] };
}

/** The Lause design system as an MCP server: tokens, components, and (Task 4) a usage check. */
export function buildServer(data: Data): McpServer {
  const server = new McpServer({ name: 'lause-ds', version: PKG_VERSION });

  server.registerTool(
    'list_tokens',
    {
      title: 'List semantic tokens',
      description:
        'Every semantic token of the Lause design system with its resolved value in light and dark mode, its CSS custom property, its Tailwind theme key, and what it is for. Use it before choosing any colour, radius, shadow or type role.',
      inputSchema: {},
    },
    async () => json(listTokens(data)),
  );

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description:
        'Every component and hook the Lause design system exports, with its kind (component or hook) and a one-line summary of what it is for. Use it to find the right component before building a screen from scratch.',
      inputSchema: {},
    },
    async () => json(listComponents(data)),
  );

  server.registerTool(
    'get_component',
    {
      title: 'Get component',
      description:
        'The full record for one named Lause component or hook: its props, states, proof screen, Figma reference, usage rules, and the text of its source and story files. Use it before writing or reviewing code that uses the component.',
      inputSchema: { name: z.string().describe('The component name as exported from lause-ds, e.g. Button') },
    },
    async ({ name }) => {
      const result = getComponent(data, name);
      if ('isError' in result) return errorText(result.message);
      return json(result);
    },
  );

  server.registerTool(
    'check_usage',
    {
      title: 'Check usage',
      description:
        'Checks a snippet of JSX/TSX/CSS against the Lause rules and returns findings with line numbers and fixes: raw hex, raw fonts, Tailwind utilities outside the closed theme, raw sizes, tiles in a row, text sizes outside the six roles, buttons without a focus ring. Empty findings means the snippet follows the system.',
      inputSchema: { code: z.string() },
    },
    async ({ code }) => json(checkUsage(data, code)),
  );

  return server;
}
