import { describe, it, expect, beforeAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../src/server.js';
import { loadData } from '../src/data.js';
import { checkUsage } from '../src/check-usage.js';

const data = loadData();

function rules(findings: { rule: string }[]): string[] {
  return findings.map((f) => f.rule);
}

describe('checkUsage', () => {
  // --- rule 1: raw-hex ---
  it('flags a raw hex colour literal', () => {
    const { findings } = checkUsage(data, 'const c = "#ff5a36";');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ rule: 'raw-hex', line: 1 });
    expect(findings[0].message).toMatch(/semantic colour token/);
  });

  it('does not flag a hex literal inside a comment', () => {
    const code = ['// old colour was #ff5a36', 'const x = "bg-ink";'].join('\n');
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).not.toContain('raw-hex');
  });

  // --- rule 2: raw-font ---
  it('flags a raw font name used in a style', () => {
    const code = `<div className="font-sans" style={{ fontFamily: 'Inter' }} />`;
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).toContain('raw-font');
    expect(findings.find((f) => f.rule === 'raw-font')!.message).toMatch(/font-content or font-chrome/);
  });

  it('does not flag font-content used through the token', () => {
    const code = `<div className="font-content">Hello</div>`;
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).not.toContain('raw-font');
  });

  // --- rule 3: off-theme-utility ---
  it('flags a Tailwind colour utility outside the closed theme', () => {
    const { findings } = checkUsage(data, `<div className="bg-red-500">x</div>`);
    expect(findings.some((f) => f.rule === 'off-theme-utility')).toBe(true);
  });

  it('does not flag a Tailwind colour utility that is a theme key', () => {
    const { findings } = checkUsage(data, `<div className="bg-ink">x</div>`);
    expect(rules(findings)).not.toContain('off-theme-utility');
  });

  // --- rule 4: tile-in-row ---
  it('flags three or more Tiles as direct children of a row container', () => {
    const code = [
      '<div className="flex flex-row">',
      '  <Tile>A</Tile>',
      '  <Tile>B</Tile>',
      '  <Tile>C</Tile>',
      '</div>',
    ].join('\n');
    const { findings } = checkUsage(data, code);
    const found = findings.find((f) => f.rule === 'tile-in-row');
    expect(found).toBeDefined();
    expect(found!.line).toBe(1);
  });

  it('does not flag two Tiles in a row container', () => {
    const code = ['<div className="flex flex-row">', '  <Tile>A</Tile>', '  <Tile>B</Tile>', '</div>'].join('\n');
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).not.toContain('tile-in-row');
  });

  // --- rule 5: stem-without-role ---
  it('flags a text-size utility outside the six roles', () => {
    const { findings } = checkUsage(data, `<p className="text-sm">Hi</p>`);
    expect(findings.some((f) => f.rule === 'stem-without-role')).toBe(true);
  });

  it('does not flag a text role', () => {
    const { findings } = checkUsage(data, `<p className="text-body">Hi</p>`);
    expect(rules(findings)).not.toContain('stem-without-role');
  });

  // --- rule 6: focus-missing ---
  it('flags a raw button without a focus ring', () => {
    const { findings } = checkUsage(data, `<button onClick={handleClick}>Go</button>`);
    const found = findings.find((f) => f.rule === 'focus-missing');
    expect(found).toBeDefined();
    expect(found!.message).toMatch(/focus ring/);
  });

  it('does not flag a button that already has focus-visible styles', () => {
    const code = `<button className="focus-visible:ring-2">Go</button>`;
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).not.toContain('focus-missing');
  });

  it('does not flag the system Button component even without visible focus classes', () => {
    const { findings } = checkUsage(data, `<Button>Go</Button>`);
    expect(rules(findings)).not.toContain('focus-missing');
  });
});

describe('check_usage tool', () => {
  let client: Client;
  beforeAll(async () => {
    const [a, b] = InMemoryTransport.createLinkedPair();
    const server = buildServer(loadData());
    await server.connect(a);
    client = new Client({ name: 'test', version: '0' });
    await client.connect(b);
  });
  const text = (r: any) => JSON.parse(r.content[0].text);

  it('returns no findings for a clean snippet', async () => {
    const code = ['<div className="flex flex-col gap-16">', '  <Tile>A</Tile>', '</div>'].join('\n');
    const out = text(await client.callTool({ name: 'check_usage', arguments: { code } }));
    expect(out).toEqual({ findings: [] });
  });

  it('flags a raw hex colour through the tool with a line number', async () => {
    const out = text(await client.callTool({ name: 'check_usage', arguments: { code: 'const c = "#ff5a36";' } }));
    expect(out.findings).toHaveLength(1);
    expect(out.findings[0]).toMatchObject({ rule: 'raw-hex', line: 1 });
  });
});
