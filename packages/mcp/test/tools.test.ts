import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../src/server.js';
import { loadData } from '../src/data.js';
import { getComponent } from '../src/tools.js';

let client: Client;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = buildServer(loadData());
  await server.connect(a);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(b);
});
const text = (r: any) => JSON.parse(r.content[0].text);

describe('tools', () => {
  it('lists the four tools with descriptions', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['check_usage', 'get_component', 'list_components', 'list_tokens']);
    for (const t of tools) expect(t.description!.length).toBeGreaterThan(40);
  });
  it('list_tokens returns semantics with both modes and the intent', async () => {
    const out = text(await client.callTool({ name: 'list_tokens', arguments: {} }));
    const ink = out.tokens.find((t: any) => t.name === 'color.ink');
    expect(ink).toEqual({ name: 'color.ink', type: 'color', light: '#0f2238', dark: '#e3ecf7', css: '--lause-color-ink', tailwind: 'ink', description: expect.stringMatching(/text/) });
  });
  it('list_tokens renders a shadow composite as the CSS shorthand', async () => {
    const out = text(await client.callTool({ name: 'list_tokens', arguments: {} }));
    const tile = out.tokens.find((t: any) => t.name === 'shadow.tile');
    expect(tile.light).toBe('0px 6px 18px 0px rgba(15, 34, 56, 0.10)');
    expect(tile.tailwind).toBe('shadow-tile');
  });
  it('list_components returns names and one-line purposes', async () => {
    const out = text(await client.callTool({ name: 'list_components', arguments: {} }));
    expect(out.components.find((c: any) => c.name === 'Dial').summary).toMatch(/radio group/);
  });
  it('get_component returns props, states, source, rules, proof screen, figma', async () => {
    const out = text(await client.callTool({ name: 'get_component', arguments: { name: 'Tile' } }));
    expect(out.source).toBe('packages/ui/src/Tile/Tile.tsx');
    expect(out.sourceText).toMatch(/export function Tile/);
    expect(out.states).toContain('Selected');
    expect(out.figma.setId).toBe('11:69');
  });
  it('get_component with an unknown name lists the names instead of guessing', async () => {
    const r: any = await client.callTool({ name: 'get_component', arguments: { name: 'Card' } });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toMatch(/Keycap, Button/);
  });
});

describe('getComponent against a published-style build with no ui sources', () => {
  let emptyRoot: string;
  beforeAll(() => {
    emptyRoot = mkdtempSync(join(tmpdir(), 'lause-ds-mcp-empty-'));
  });
  afterAll(() => {
    rmSync(emptyRoot, { recursive: true, force: true });
  });
  it('returns placeholders instead of throwing when source and story files are missing', () => {
    const data = loadData();
    const result = getComponent(data, 'Tile', emptyRoot);
    expect('isError' in result).toBe(false);
    if ('isError' in result) throw new Error('unexpected error result');
    expect(result.sourceText).toBe('(not available in this build)');
    expect(result.storiesText).toBe('(not available in this build)');
  });
});
