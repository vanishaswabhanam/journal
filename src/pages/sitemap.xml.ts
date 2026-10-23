// A hand-built sitemap rather than the @astrojs/sitemap integration — this
// site is small (a handful of static pages plus one per journal) and
// already has getJournals() to enumerate those, so a plain endpoint here
// is the zero-new-dependency way to get the same result. Pointed to from
// public/robots.txt.
import { getJournals, getPouches } from '../lib/journals';
import { site } from '../site.config';

export async function GET() {
  const products = [...(await getJournals()), ...(await getPouches())];
  const paths = ['/', '/journal/', '/contact/', ...products.map((p) => p.href)];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${new URL(path, site.url).toString()}</loc></url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
