import type { Preview } from '@storybook/react-vite';
import { useLayoutEffect } from 'react';
import './preview.css';

export type Theme = 'light' | 'dark';

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: 'Colour mode',
      toolbar: { title: 'Theme', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, { globals }) => {
      const theme = (globals.theme as Theme) ?? 'light';
      useLayoutEffect(() => {
        document.documentElement.dataset.theme = theme;
      }, [theme]);
      return (
        <div data-theme={theme} className="min-h-screen bg-ground p-32 font-chrome text-body text-ink">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
