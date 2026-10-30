import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.sail-research.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: { ignored: ['**/tmp/**', '**/docs/training-*-qa/**'] },
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.endsWith('/register/') &&
        !page.includes('/training/') &&
        !page.includes('/team-preview-') &&
        !page.includes('/team-legacy-'),
    }),
  ],
});
