import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

interface SitemapRecipe {
  slug: string;
  title?: string | null;
  image?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export const MAX_RECIPES_PER_SITEMAP = 50000;
export const DEFAULT_RECIPES_PER_SITEMAP = 1000;

export function getRecipesPerSitemap(): number {
  const envVal = Number(process.env['RECIPES_PER_SITEMAP']);
  if (!Number.isNaN(envVal) && envVal > 0) {
    return Math.min(Math.floor(envVal), MAX_RECIPES_PER_SITEMAP);
  }
  return DEFAULT_RECIPES_PER_SITEMAP;
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
export interface ISitemap {
  generate(baseUrl: string, page?: number): Promise<string | null> | string | null;
}

// 2. Concrete Strategy: Master Sitemap
export class MasterSitemap implements ISitemap {
  async generate(baseUrl: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    const recipeSitemaps: string[] = [];

    try {
      const supabase = await getSupabaseClient();
      const query = supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .lte('created_at', new Date().toISOString());

      const res = await query;
      const count = res?.count;
      const limit = getRecipesPerSitemap();
      if (typeof count === 'number') {
        if (count > 0) {
          recipeSitemaps.push(`  <sitemap>
    <loc>${baseUrl}/sitemap-recipes.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
          if (count > limit) {
            const totalPages = Math.ceil(count / limit);
            for (let page = 2; page <= totalPages; page++) {
              recipeSitemaps.push(`  <sitemap>
    <loc>${baseUrl}/sitemap-recipes-${page}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
            }
          }
        }
      } else {
        // Fallback when count is undefined
        recipeSitemaps.push(`  <sitemap>
    <loc>${baseUrl}/sitemap-recipes.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
      }
    } catch {
      // Fallback if database query fails
      recipeSitemaps.push(`  <sitemap>
    <loc>${baseUrl}/sitemap-recipes.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`);
    }

    const sitemapsXml = [
      `  <sitemap>\n    <loc>${baseUrl}/sitemap-pages.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`,
      `  <sitemap>\n    <loc>${baseUrl}/sitemap-categories.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`,
      ...recipeSitemaps,
    ].join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapsXml}
</sitemapindex>`;
  }
}

// 2. Concrete Strategy: Static Pages
export class PagesSitemap implements ISitemap {
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

function extractTaxonomyUrls(
  data: { slug?: string | null }[] | null | undefined,
  basePath: string,
): string[] {
  const items = data ?? [];
  const distinctSlugs = Array.from(
    new Set(
      items
        .map((item) => item?.slug?.trim())
        .filter((slug): slug is string => Boolean(slug && slug.length > 0)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  if (distinctSlugs.length === 0) {
    return [];
  }

  return [basePath, ...distinctSlugs.map((slug) => `${basePath}/${slug}`)];
}

function extractCategoryUrls(data: { url?: string | null }[] | null | undefined): string[] {
  const items = data ?? [];
  const distinctUrls = Array.from(
    new Set(
      items
        .map((cat) => cat?.url?.trim())
        .filter((url): url is string => Boolean(url && url.length > 0)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  if (distinctUrls.length === 0) {
    return [];
  }

  const childUrls = distinctUrls
    .map((url) => (url.startsWith('/') ? url : `/${url}`))
    .filter((url) => url !== '/recipes');

  return ['/recipes', ...childUrls];
}

// 2. Concrete Strategy: Categories
export class CategoriesSitemap implements ISitemap {
  async generate(baseUrl: string): Promise<string> {
    const urls: string[] = [];

    try {
      const supabase = await getSupabaseClient();
      const now = new Date().toISOString();

      const [categoriesRes, holidaysRes, methodsRes, specialDietsRes, theBestRes] =
        await Promise.all([
          supabase
            .from('categories')
            .select('url, recipe_categories!inner (recipes!inner (status, created_at))')
            .eq('recipe_categories.recipes.status', 'published')
            .lte('recipe_categories.recipes.created_at', now),
          supabase
            .from('holidays')
            .select('slug, recipe_holidays!inner (recipes!inner (status, created_at))')
            .eq('recipe_holidays.recipes.status', 'published')
            .lte('recipe_holidays.recipes.created_at', now),
          supabase
            .from('methods')
            .select('slug, recipe_methods!inner (recipes!inner (status, created_at))')
            .eq('recipe_methods.recipes.status', 'published')
            .lte('recipe_methods.recipes.created_at', now),
          supabase
            .from('special_diets')
            .select('slug, recipe_special_diets!inner (recipes!inner (status, created_at))')
            .eq('recipe_special_diets.recipes.status', 'published')
            .lte('recipe_special_diets.recipes.created_at', now),
          supabase
            .from('recipes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .eq('the_best', true)
            .lte('created_at', now),
        ]);

      urls.push(
        ...extractCategoryUrls(categoriesRes?.data as { url?: string | null }[] | null),
        ...extractTaxonomyUrls(holidaysRes?.data as { slug?: string | null }[] | null, '/holidays'),
        ...extractTaxonomyUrls(methodsRes?.data as { slug?: string | null }[] | null, '/methods'),
        ...extractTaxonomyUrls(
          specialDietsRes?.data as { slug?: string | null }[] | null,
          '/special-diets',
        ),
      );

      if (typeof theBestRes?.count === 'number' && theBestRes.count > 0) {
        urls.push('/the-best-recipes');
      }
    } catch {
      // Fallback if database query fails: generate empty urlset
    }

    const urlsXml = urls
      .map(
        (url) => `  <url>
    <loc>${baseUrl}${escapeXml(url)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
  }
}

function buildRecipeImageTag(image: string | null | undefined, optimizeImage: string): string {
  if (!image) {
    return '';
  }
  const imageUrl =
    image.startsWith('http://') || image.startsWith('https://')
      ? image
      : `${optimizeImage}${image}`;

  return `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
    </image:image>`;
}

function buildRecipeUrlXml(recipe: SitemapRecipe, baseUrl: string, optimizeImage: string): string {
  const loc = `${baseUrl}/recipe/${escapeXml(recipe.slug)}`;
  const lastmodDate = recipe.updated_at || recipe.created_at;
  const lastmodTag = lastmodDate ? `\n    <lastmod>${lastmodDate.split('T')[0]}</lastmod>` : '';
  const imageTag = buildRecipeImageTag(recipe.image, optimizeImage);

  return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${imageTag}
  </url>`;
}

async function fetchSitemapRecipes(
  from: number,
  to: number,
  limit: number,
): Promise<SitemapRecipe[]> {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from('recipes')
    .select('slug, image, updated_at, created_at')
    .eq('status', 'published')
    .lte('created_at', new Date().toISOString());

  const chainable = query as unknown as {
    order?: (column: string, options?: { ascending?: boolean }) => typeof query;
    range?: (from: number, to: number) => typeof query;
  };

  if (typeof chainable.order === 'function') {
    query = chainable.order('created_at', { ascending: false });
    const chainableSlug = query as unknown as {
      order?: (column: string, options?: { ascending?: boolean }) => typeof query;
    };
    if (typeof chainableSlug.order === 'function') {
      query = chainableSlug.order('slug', { ascending: true });
    }
  }

  const chainableRange = query as unknown as {
    range?: (from: number, to: number) => typeof query;
  };
  if (typeof chainableRange.range === 'function') {
    query = chainableRange.range(from, to);
  }

  const { data } = await query;
  const recipes = (data as SitemapRecipe[] | null) ?? [];

  return recipes.length > limit ? recipes.slice(from, to + 1) : recipes;
}

/**
 * 4. DYNAMIC RECIPES SITEMAP (+ Google Image Extensions)
 * GET /sitemap-recipes.xml (Page 1), /sitemap-recipes-2.xml (Page 2), etc.
 */
// 2. Concrete Strategy: Recipes
export class RecipesSitemap implements ISitemap {
  constructor(private readonly page = 1) {}

  async generate(baseUrl: string, pageOverride?: number): Promise<string | null> {
    const optimizeImage = process.env['OPTIMIZE_IMAGE'];
    if (!optimizeImage) {
      throw new Error('OPTIMIZE_IMAGE is required');
    }

    const effectivePage = pageOverride && pageOverride > 0 ? pageOverride : this.page;
    const limit = getRecipesPerSitemap();
    const from = (effectivePage - 1) * limit;
    const to = from + limit - 1;

    let recipesXml = '';

    try {
      const recipes = await fetchSitemapRecipes(from, to, limit);

      // If a paginated chunk page >= 2 has no recipes, return null so it returns 404
      if (effectivePage >= 2 && recipes.length === 0) {
        return null;
      }

      if (recipes.length > 0) {
        recipesXml = recipes
          .map((recipe) => buildRecipeUrlXml(recipe, baseUrl, optimizeImage))
          .join('\n');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'OPTIMIZE_IMAGE is required') {
        throw err;
      }
      if (effectivePage >= 2) {
        return null;
      }
      // Fallback if database query fails for page 1
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${recipesXml}
</urlset>`;
  }
}

const SITEMAP_PATTERN = /\/sitemap[^/]*\.xml$/;
const RECIPES_PAGED_PATTERN = /^\/sitemap-recipes-([2-9]|[1-9]\d+)\.xml$/;

const staticRoutes: Record<string, ISitemap> = {
  '/sitemap.xml': new MasterSitemap(),
  '/sitemap-pages.xml': new PagesSitemap(),
  '/sitemap-categories.xml': new CategoriesSitemap(),
  '/sitemap-recipes.xml': new RecipesSitemap(1),
};

// 3. The Router Dictionary ("Switch")
export const sitemapRoutes: Record<string, ISitemap | undefined> = new Proxy(staticRoutes, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    const match = RECIPES_PAGED_PATTERN.exec(prop);
    return match ? new RecipesSitemap(Number(match[1])) : undefined;
  },
});

// 4. The Main Handler
export default async function sitemap(req: VercelRequest, res: VercelResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
  const rawPath = (req.query?.['path'] as string | undefined) || url.pathname;

  // Extract sitemap filename e.g., '/sitemap.xml', '/sitemap-recipes.xml', '/sitemap-recipes-2.xml'
  const match = SITEMAP_PATTERN.exec(rawPath);
  const routeKey = match ? match[0] : '';

  // Extract any prefix preceding the sitemap filename (e.g., '/kitchen', '/blog', or '')
  const prefix = match ? rawPath.slice(0, match.index) : '';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');

  const rawBaseUrl = getBaseUrl(req);
  const baseUrl = `${rawBaseUrl}${prefix}`;

  const queryPage = req.query?.['page'] ? Number(req.query['page']) : undefined;
  const isInvalidQueryPage = queryPage !== undefined && (Number.isNaN(queryPage) || queryPage < 1);
  const handler = isInvalidQueryPage ? undefined : sitemapRoutes[routeKey];
  const xmlContent = handler ? await handler.generate(baseUrl, queryPage) : null;

  if (xmlContent) {
    res.status(200).send(xmlContent);
  } else {
    res.statusCode = 404;
    res.send('Not Found');
  }
}
