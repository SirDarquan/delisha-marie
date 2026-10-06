import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

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

function getBaseUrl(req: VercelRequest): string {
  let base: string;
  const vercelEnv = process.env['VERCEL_ENV'];
  if (process.env['SITE_URL']) {
    base = process.env['SITE_URL'];
  } else if (vercelEnv === 'preview') {
    base = `https://${process.env['VERCEL_URL']}`;
  } else if (vercelEnv === 'production') {
    base = `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`;
  } else {
    const proto = req.headers?.['x-forwarded-proto'] || 'https';
    const host = req.headers?.['host'] || 'localhost';
    base = `${proto}://${host}`;
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

// 1. Define the Interface
interface ISitemap {
  generate(baseUrl: string): Promise<string> | string;
}

// 2. Concrete Strategy: Master Sitemap
class MasterSitemap implements ISitemap {
  generate(baseUrl: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
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
  }
}
// 2. Concrete Strategy: Static Pages
class PagesSitemap implements ISitemap {
  generate(baseUrl: string): string {
    const pages = [
      { url: '/', changefreq: 'weekly', priority: '1.0' },
      { url: '/recipe-index', changefreq: 'weekly', priority: '0.9' },
      { url: '/search', changefreq: 'weekly', priority: '0.7' },
      { url: '/faq', changefreq: 'monthly', priority: '0.6' },
      { url: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
    ];

    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
  }
}

// 2. Concrete Strategy: Categories
class CategoriesSitemap implements ISitemap {
  generate(baseUrl: string): string {
    const categories = ['/recipes', '/methods', '/holidays', '/special-diets', '/the-best-recipes'];
    return `<?xml version="1.0" encoding="UTF-8"?>
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
  }
}
/**
 * 4. DYNAMIC RECIPES SITEMAP (+ Google Image Extensions)
 * GET /sitemap-recipes.xml
 */
// 2. Concrete Strategy: Recipes
class RecipesSitemap implements ISitemap {
  async generate(baseUrl: string): Promise<string> {
    const optimizeImage = process.env['OPTIMIZE_IMAGE'];
    if (!optimizeImage) {
      throw new Error('OPTIMIZE_IMAGE is required');
    }

    let recipesXml = '';

    try {
      const supabase = await getSupabaseClient();
      const { data } = await supabase
        .from('recipes')
        .select('slug, image, updated_at, created_at')
        .eq('status', 'published')
        .lte('created_at', new Date().toISOString());

      const recipes = data as SitemapRecipe[] | null;

      if (recipes && recipes.length > 0) {
        recipesXml = recipes
          .map((recipe: SitemapRecipe) => {
            const loc = `${baseUrl}/recipe/${escapeXml(recipe.slug)}`;
            const lastmodDate = recipe.updated_at || recipe.created_at || new Date().toISOString();
            const lastmod = lastmodDate.split('T')[0];

            let imageTag = '';
            if (recipe.image) {
              const imageUrl =
                recipe.image.startsWith('http://') || recipe.image.startsWith('https://')
                  ? recipe.image
                  : `${optimizeImage}${recipe.image}`;
              imageTag = `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
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

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${recipesXml}
</urlset>`;
  }
}

// 3. The Router Dictionary ("Switch")
const sitemapRoutes: Record<string, ISitemap> = {
  '/sitemap.xml': new MasterSitemap(),
  '/sitemap-pages.xml': new PagesSitemap(),
  '/sitemap-categories.xml': new CategoriesSitemap(),
  '/sitemap-recipes.xml': new RecipesSitemap(),
};

const SITEMAP_PATTERN = /\/sitemap[^/]*\.xml$/;

// 4. The Main Handler
export default async function sitemap(req: VercelRequest, res: VercelResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
  const rawPath = (req.query?.['path'] as string | undefined) || url.pathname;

  // Extract sitemap filename e.g., '/sitemap.xml', '/sitemap-recipes.xml'
  const match = SITEMAP_PATTERN.exec(rawPath);
  const routeKey = match ? match[0] : '';

  // Extract any prefix preceding the sitemap filename (e.g., '/kitchen', '/blog', or '')
  const prefix = match ? rawPath.slice(0, match.index) : '';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');

  const handler = sitemapRoutes[routeKey];

  if (handler) {
    const rawBaseUrl = getBaseUrl(req);
    const baseUrl = `${rawBaseUrl}${prefix}`;
    const xmlContent = await handler.generate(baseUrl);
    res.status(200).send(xmlContent);
  } else {
    res.statusCode = 404;
    res.send('Not Found');
  }
}
