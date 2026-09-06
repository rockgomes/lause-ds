import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  // The `.mdx` glob first: Storybook lists stories in the order their globs are collected, and
  // this page is the sidebar's front door — it should lead, not trail, the component list.
  stories: ['../src/**/*.mdx', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  viteFinal: (viteConfig) => mergeConfig(viteConfig, { plugins: [tailwindcss()] }),
};

export default config;
