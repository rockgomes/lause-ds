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

  // --- expression-attribute tag boundaries (fix round 1) ---
  it('does not lose className after an inline arrow-function onClick', () => {
    const code = `<button onClick={() => setOpen(true)} className="focus-visible:ring-2">Go</button>`;
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).not.toContain('focus-missing');
  });

  it('still finds tile-in-row when the row container has an inline arrow-function onClick', () => {
    const code = [
      '<div onClick={() => f()} className="flex flex-row">',
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

  it('does not crash and does not false-flag a nested-brace, comparison-bearing handler', () => {
    const code = `<button onClick={(e) => { if (x > 1) go(); }} className="focus-visible:ring-2">Go</button>`;
    expect(() => checkUsage(data, code)).not.toThrow();
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).not.toContain('focus-missing');
  });

  // --- rule: raw-size ---
  it('flags an arbitrary pixel width outside the allowed exceptions', () => {
    const { findings } = checkUsage(data, `<div className="w-[500px]">x</div>`);
    const found = findings.find((f) => f.rule === 'raw-size');
    expect(found).toBeDefined();
    expect(found!.message).toMatch(/44px.*640px.*1020px/);
  });

  it('does not flag the allowed raw sizes, CSS functions, or variable refs', () => {
    const code = `<div className="min-h-[44px] max-w-[640px] max-w-[min(320px,90vw)] pl-(--lause-space-8)">x</div>`;
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).not.toContain('raw-size');
  });

  it('reports an arbitrary text size once, under stem-without-role, not raw-size', () => {
    const { findings } = checkUsage(data, `<p className="text-[18px]">Hi</p>`);
    expect(rules(findings).filter((r) => r === 'raw-size' || r === 'stem-without-role')).toEqual([
      'stem-without-role',
    ]);
  });

  // --- comment stripping must not eat code (fix round 2) ---
  it('does not treat the // of a URL as a comment', () => {
    const code = `<a href="https://example.com" className="bg-red-500 text-sm">x</a>`;
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).toContain('off-theme-utility');
    expect(rules(findings)).toContain('stem-without-role');
  });

  it('still strips a real line comment', () => {
    const code = ['// bg-red-500 text-sm were the old classes', '<div className="bg-ink">x</div>'].join('\n');
    const { findings } = checkUsage(data, code);
    expect(findings).toEqual([]);
  });

  it('does not blank the line a regex literal sits on', () => {
    const code = 'const URL_RE = /https?:\\/\\//; const c = "#ff5a36";';
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).toContain('raw-hex');
  });

  // --- class strings wrapped over several lines (fix round 2) ---
  it('reads a prettier-wrapped clsx call, with the line of each string', () => {
    const code = ['<div', '  className={clsx(', '    "bg-red-500 p-11",', '    "text-sm",', '  )}', '/>'].join('\n');
    const { findings } = checkUsage(data, code);
    const offTheme = findings.filter((f) => f.rule === 'off-theme-utility');
    expect(offTheme.map((f) => f.line)).toEqual([3, 3]);
    const stem = findings.find((f) => f.rule === 'stem-without-role');
    expect(stem?.line).toBe(4);
  });

  it('reads a cn() call', () => {
    const { findings } = checkUsage(data, `<div className={cn("bg-red-500", "text-sm")}>x</div>`);
    expect(rules(findings)).toContain('off-theme-utility');
    expect(rules(findings)).toContain('stem-without-role');
  });

  // --- correct Tailwind that names a keyword, not a token (fix round 2) ---
  const noFinding = (code: string) => {
    const { findings } = checkUsage(data, code);
    expect(findings).toEqual([]);
  };

  it('does not flag auto margins or sizing keywords', () => {
    noFinding(`<div className="mx-auto h-fit w-fit w-1/2 max-w-full">x</div>`);
  });

  it('does not flag border sides and styles', () => {
    noFinding(`<div className="border border-b border-t border-dashed">x</div>`);
  });

  it('does not flag text wrapping and alignment keywords', () => {
    noFinding(`<p className="text-balance text-wrap text-nowrap text-start">Hi</p>`);
  });

  it('does not flag background gradients, sizes and positions', () => {
    noFinding(`<div className="bg-gradient-to-r bg-cover bg-center bg-no-repeat">x</div>`);
  });

  it('does not flag a per-side border colour or width', () => {
    noFinding(`<div className="border-t-ink after:border-t-ink border-b-2 border-spacing-12">x</div>`);
  });

  it('does not flag text-decoration styles', () => {
    noFinding(`<span className="underline decoration-accent decoration-dotted decoration-solid">x</span>`);
  });

  it('does not mistake the colon of an arbitrary value for a variant', () => {
    noFinding(`<span className="decoration-(length:--lause-stroke-mark) border-(length:--lause-stroke-thin)">x</span>`);
  });

  it('does not flag font weights, which stay open', () => {
    noFinding(`<p className="font-light font-extrabold font-thin">Hi</p>`);
  });

  // --- raw-font must not fire on prose ---
  it('does not flag a font name mentioned in plain JSX text', () => {
    const { findings } = checkUsage(data, `<p>Georgia is a country.</p>`);
    expect(rules(findings)).not.toContain('raw-font');
  });

  it('flags a font name used in an arbitrary class value', () => {
    const { findings } = checkUsage(data, `<div className="font-[Georgia]">x</div>`);
    expect(rules(findings)).toContain('raw-font');
  });

  it('flags a font name used in a style object', () => {
    const code = `<div style={{ fontFamily: 'Georgia' }}>x</div>`;
    const { findings } = checkUsage(data, code);
    expect(rules(findings)).toContain('raw-font');
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

  it('checks a 300 KB file with 5 000 tags in under two seconds', () => {
    const unit = [
      '<div className="flex flex-col gap-16">',
      `  <p className="text-body">${'lorem ipsum dolor sit amet '.repeat(7)}</p>`,
      '</div>',
    ].join('\n');
    const code = Array.from({ length: 1250 }, () => unit).join('\n'); // 4 tags each
    expect(code.length).toBeGreaterThan(300_000);
    const started = performance.now();
    const { findings } = checkUsage(data, code);
    const elapsed = performance.now() - started;
    expect(findings).toEqual([]);
    expect(elapsed).toBeLessThan(2000);
  });

  it('flags a raw hex colour through the tool with a line number', async () => {
    const out = text(await client.callTool({ name: 'check_usage', arguments: { code: 'const c = "#ff5a36";' } }));
    expect(out.findings).toHaveLength(1);
    expect(out.findings[0]).toMatchObject({ rule: 'raw-hex', line: 1 });
  });

  it('refuses a snippet longer than the documented limit', async () => {
    const result: any = await client.callTool({ name: 'check_usage', arguments: { code: 'x'.repeat(250_001) } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/at most 200000 characters/);
  });
});
