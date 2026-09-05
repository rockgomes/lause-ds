import { describe, it, expect, beforeAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../src/server.js';
import { loadData } from '../src/data.js';

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
