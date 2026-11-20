import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

/**
 * Deploy padrão: GitHub Pages (projeto em subpasta /bananadev).
 * Para Cloudflare Pages ou domínio próprio, defina SITE_URL e BASE_PATH.
 * Veja docs/DEPLOY.md.
 */
const site = process.env.SITE_URL ?? 'https://xjonathandebritoX.github.io';
const base = process.env.BASE_PATH ?? '/bananadev';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [sitemap()],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      cssCodeSplit: false,
    },
  },
});
