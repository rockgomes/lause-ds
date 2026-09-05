import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../src/version.js';

const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url));

describe('VERSION', () => {
  it('matches the version in packages/mcp/package.json', () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string };
    expect(VERSION).toBe(pkg.version);
  });
});
