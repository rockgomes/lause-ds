import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'node:path';

export default defineConfig({
  plugins: [tailwindcss(), storybookTest({ configDir: join(import.meta.dirname, '.storybook') })],
  test: {
    name: 'ui',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
