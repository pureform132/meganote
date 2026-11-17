import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

// Single self-contained index.html — double-clickable anywhere, no server needed.
const inlineFavicon: Plugin = {
  name: 'inline-favicon',
  transformIndexHtml(html) {
    const svg = readFileSync(new URL('./public/favicon.svg', import.meta.url), 'utf8');
    const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return html.replace('href="./favicon.svg"', `href="${uri}"`);
  },
};

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), inlineFavicon],
  server: { port: 4321, strictPort: false },
  build: { target: 'es2022' },
});
