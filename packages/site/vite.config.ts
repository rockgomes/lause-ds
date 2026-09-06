import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: '../../site', emptyOutDir: true },
  server: {
    // The MCP function only exists in a Netlify deploy; in `vite dev` the
    // Ask panel talks to production.
    proxy: { '/mcp': { target: 'https://shiny-frangipane-78fc08.netlify.app', changeOrigin: true } },
  },
});
