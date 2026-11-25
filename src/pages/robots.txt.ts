import type { APIRoute } from 'astro';

/**
 * robots.txt gerado no build para apontar ao sitemap com a URL e a base corretas,
 * independentemente do destino (Cloudflare Pages na raiz ou GitHub Pages em subpasta).
 */
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const origin = site ?? new URL('https://bananadev.pages.dev/');
  const sitemap = new URL(`${base}sitemap-index.xml`, origin).toString();

  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
