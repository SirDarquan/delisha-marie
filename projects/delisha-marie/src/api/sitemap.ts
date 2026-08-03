import { Request, Response, Router } from 'express';
import { getSupabaseClient } from './supabase';

const sitemapRouter = Router();

interface SitemapRecipe {
  slug: string;
  title?: string | null;
  image?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getBaseUrl(): string {
  return process.env['SITE_URL'] || '';
}

/**
 * 1. MASTER SITEMAP INDEX ("Sitemap of Sitemaps")
 * GET /sitemap.xml
 */
sitemapRouter.get('/sitemap.xml', (_req: Request, res: Response): void => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    res.status(200);
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-recipes.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.send(xmlContent);
});

/**
 * 2. STATIC PAGES SITEMAP
 * GET /sitemap-pages.xml
 */
sitemapRouter.get('/sitemap-pages.xml', (_req: Request, res: Response): void => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    res.status(200);
    return;
  }
  const pages = [
    { url: '/', changefreq: 'weekly', priority: '1.0' },
    { url: '/recipe-index', changefreq: 'weekly', priority: '0.9' },
    { url: '/search', changefreq: 'weekly', priority: '0.7' },
    { url: '/faq', changefreq: 'monthly', priority: '0.6' },
    { url: '/about', changefreq: 'monthly', priority: '0.6' },
    { url: '/contact', changefreq: 'monthly', priority: '0.5' },
    { url: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  ];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.send(xmlContent);
});

/**
 * 3. CATEGORY HUBS SITEMAP
 * GET /sitemap-categories.xml
 */
sitemapRouter.get('/sitemap-categories.xml', (_req: Request, res: Response): void => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    res.status(200);
    return;
  }
  const categories = ['/recipes', '/methods', '/holidays', '/special-diets', '/the-best-recipes'];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories
  .map(
    (cat) => `  <url>
    <loc>${baseUrl}${cat}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.send(xmlContent);
});

/**
 * 4. DYNAMIC RECIPES SITEMAP (+ Google Image Extensions)
 * GET /sitemap-recipes.xml
 */
sitemapRouter.get('/sitemap-recipes.xml', async (_req: Request, res: Response): Promise<void> => {
  const baseUrl = getBaseUrl();
  let recipesXml = '';

  try {
    const supabase = await getSupabaseClient();
    const { data } = await supabase
      .from('recipes')
      .select('slug, image, updated_at, created_at')
      .eq('status', 'published');

    const recipes = data as SitemapRecipe[] | null;

    if (recipes && recipes.length > 0) {
      recipesXml = recipes
        .map((recipe: SitemapRecipe) => {
          const loc = `${baseUrl}/recipe/${escapeXml(recipe.slug)}`;
          const lastmodDate = recipe.updated_at || recipe.created_at || new Date().toISOString();
          const lastmod = lastmodDate.split('T')[0];

          let imageTag = '';
          if (recipe.image) {
            imageTag = `
    <image:image>
      <image:loc>${escapeXml(recipe.image)}</image:loc>
    </image:image>`;
          }

          return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${imageTag}
  </url>`;
        })
        .join('\n');
    }
  } catch {
    // Fallback if database query fails
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${recipesXml}
</urlset>`;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.send(xmlContent);
});

export default sitemapRouter;
