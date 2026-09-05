import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'mcp',
    // Builds dist/ once before any test runs; see test/global-setup.ts.
    globalSetup: ['./test/global-setup.ts'],
  },
});
