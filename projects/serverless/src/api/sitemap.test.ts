import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { createRequestMock } from './test-utils';
import sitemapRouter, {
  getRecipesPerSitemap,
  MAX_RECIPES_PER_SITEMAP,
  DEFAULT_RECIPES_PER_SITEMAP,
} from './sitemap';
import { resetSupabaseClient } from './supabase';

describe('sitemap', () => {
  const app = null;
  let request: ReturnType<typeof createRequestMock>;
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockLte = vi.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['SUPABASE_KEY'] = 'test-key';
    process.env['OPTIMIZE_IMAGE'] = 'https://ik.imagekit.io/delishamarie';
    delete process.env['SITE_URL'];
    resetSupabaseClient();

    request = createRequestMock(sitemapRouter);

    mockFrom.mockImplementation((table: string) => {
      const createBuilder = () => {
        let theBestFilter = false;
        const builder: Record<string, unknown> = {
          select: vi.fn().mockImplementation(() => builder),
          eq: vi.fn().mockImplementation((col: string, val: unknown) => {
            if (col === 'the_best' && val === true) {
              theBestFilter = true;
            }
            return builder;
          }),
          lte: vi.fn().mockImplementation(() => {
            if (table === 'categories') {
              return Promise.resolve({
                data: [
                  { url: '/recipes/dinner' },
                  { url: '/recipes/dinner/pasta' },
                  { url: '/recipes/desserts' },
                ],
                error: null,
              });
            }
            if (table === 'holidays') {
              return Promise.resolve({
                data: [{ slug: 'thanksgiving' }, { slug: 'christmas' }],
                error: null,
              });
            }
            if (table === 'methods') {
              return Promise.resolve({
                data: [{ slug: 'baking' }, { slug: 'air-fryer' }],
                error: null,
              });
            }
            if (table === 'special_diets') {
              return Promise.resolve({
                data: [{ slug: 'gluten-free' }, { slug: 'vegan' }],
                error: null,
              });
            }
            if (table === 'recipes' && theBestFilter) {
              return Promise.resolve({ count: 5, data: [], error: null });
            }
            return mockLte();
          }),
        };
        return builder;
      };

      if (
        table === 'categories' ||
        table === 'holidays' ||
        table === 'methods' ||
        table === 'special_diets'
      ) {
        return createBuilder();
      }

      return { select: mockSelect };
    });

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockImplementation((col: string, val: unknown) => {
      if (col === 'the_best' && val === true) {
        return {
          lte: vi.fn().mockResolvedValue({ count: 5, data: [], error: null }),
        };
      }
      return { eq: mockEq, lte: mockLte };
    });
    mockLte.mockReturnValue({
      data: [],
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    resetSupabaseClient();
  });

  describe('GET /sitemap.xml', () => {
    it('should return master sitemap index XML', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.headers['cache-control']).toContain('public, max-age=3600');
      expect(res.text).toContain(
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-pages.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-categories.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes.xml</loc>');
    });

    it('should use VERCEL_PROJECT_PRODUCTION_URL in production if SITE_URL is not set', async () => {
      delete process.env['SITE_URL'];
      process.env['VERCEL_ENV'] = 'production';
      process.env['VERCEL_PROJECT_PRODUCTION_URL'] = 'vercel-app.com';
      const res = await request(app).get('/sitemap.xml');
      expect(res.text).toContain('<loc>https://vercel-app.com/sitemap-pages.xml</loc>');
    });

    it('should use VERCEL_URL in preview if SITE_URL is not set', async () => {
      delete process.env['SITE_URL'];
      process.env['VERCEL_ENV'] = 'preview';
      process.env['VERCEL_URL'] = 'preview-app.vercel.app';
      const res = await request(app).get('/sitemap.xml');
      expect(res.text).toContain('<loc>https://preview-app.vercel.app/sitemap-pages.xml</loc>');
    });

    it('should fallback to req.headers if no env vars are set', async () => {
      delete process.env['SITE_URL'];
      delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
      const res = await request(app)
        .get('/sitemap.xml')
        .set('x-forwarded-proto', 'http')
        .set('host', 'my-host:3000');
      expect(res.text).toContain('<loc>http://my-host:3000/sitemap-pages.xml</loc>');
    });

    it('should fallback to defaults if headers are not provided', async () => {
      delete process.env['SITE_URL'];
      delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
      const res = await request(app).get('/sitemap.xml');
      expect(res.text).toContain('<loc>https://');
    });

    it('should fallback host to localhost when req.headers has no host', async () => {
      delete process.env['SITE_URL'];
      delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
      delete process.env['VERCEL_URL'];
      const req = {
        url: '/sitemap.xml',
        headers: { 'x-forwarded-proto': 'http' },
      } as unknown as VercelRequest;
      let sentBody = '';
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockImplementation((body: string) => {
          sentBody = body;
        }),
      } as unknown as VercelResponse;

      await sitemapRouter(req, res);
      expect(sentBody).toContain('<loc>http://localhost/sitemap-pages.xml</loc>');
    });

    it('should respect custom SITE_URL env variable', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-pages.xml</loc>');
    });
  });

  describe('GET /sitemap-pages.xml', () => {
    it('should return static pages XML with change frequencies and priorities', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-pages.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<loc>https://custom-domain.com/</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe-index</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/search</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/faq</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/privacy-policy</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/about</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/contact</loc>');
      expect(res.text).toContain('<changefreq>monthly</changefreq>');
      expect(res.text).toContain('<changefreq>yearly</changefreq>');
    });
  });

  describe('GET /sitemap-categories.xml', () => {
    it('should return category hub and child pages XML for populated taxonomies', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-categories.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipes</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipes/desserts</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipes/dinner</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipes/dinner/pasta</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/holidays</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/holidays/thanksgiving</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/holidays/christmas</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/methods</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/methods/air-fryer</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/methods/baking</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/special-diets</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/special-diets/gluten-free</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/special-diets/vegan</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/the-best-recipes</loc>');
    });

    it('should omit empty taxonomies when no recipes exist for them', async () => {
      mockFrom.mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ data: null, count: 0, error: null }),
        };
        return builder;
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-categories.xml');

      expect(res.status).toBe(200);
      expect(res.text).not.toContain('<loc>https://custom-domain.com/recipes</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/holidays</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/methods</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/special-diets</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/the-best-recipes</loc>');
      expect(res.text).not.toContain('<loc>');
    });

    it('should handle database exception in categories sitemap gracefully', async () => {
      mockFrom.mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockRejectedValue(new Error('Taxonomy failure')),
        };
        return builder;
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-categories.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(res.text).not.toContain('<loc>');
    });
  });

  describe('GET /sitemap-recipes.xml', () => {
    it('should return dynamic recipe URLs with image tags and escaped XML', async () => {
      mockLte.mockResolvedValueOnce({
        data: [
          {
            slug: 'chocolate-cake',
            title: 'Chocolate & Caramel Cake',
            image: 'https://example.com/cake.jpg?a=1&b=2',
            updated_at: '2026-08-01T12:00:00.000Z',
          },
          {
            slug: 'simple-bread',
            title: null,
            image: null,
            created_at: '2026-07-15T08:00:00.000Z',
          },
          {
            slug: 'no-dates',
            title: 'No Dates',
            image: null,
            updated_at: null,
            created_at: null,
          },
        ],
        error: null,
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-recipes.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe/chocolate-cake</loc>');
      expect(res.text).toContain('<lastmod>2026-08-01</lastmod>');
      expect(res.text).toContain('<image:loc>https://example.com/cake.jpg?a=1&amp;b=2</image:loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe/simple-bread</loc>');
      expect(res.text).toContain('<lastmod>2026-07-15</lastmod>');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe/no-dates</loc>');
    });

    it('should escape xml characters', async () => {
      mockLte.mockResolvedValueOnce({
        data: [
          {
            slug: 'weird-slug-<>"\'&',
            title: 'Weird',
          },
        ],
        error: null,
      });
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-recipes.xml');
      expect(res.text).toContain(
        '<loc>https://custom-domain.com/recipe/weird-slug-&lt;&gt;&quot;&apos;&amp;</loc>',
      );
    });

    it('should return empty XML if data array is empty', async () => {
      mockLte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-recipes.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).not.toContain('<loc>');
    });

    it('should handle database exception gracefully', async () => {
      mockLte.mockRejectedValueOnce(new Error('Database error'));

      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-recipes.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    });

    it('should return empty XML if data is null', async () => {
      mockLte.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const res = await request(app).get('/sitemap-recipes.xml');
      expect(res.text).not.toContain('<loc>');
    });

    it('should throw an error if OPTIMIZE_IMAGE is not set', async () => {
      delete process.env['OPTIMIZE_IMAGE'];
      await expect(request(app).get('/sitemap-recipes.xml')).rejects.toThrow(
        'OPTIMIZE_IMAGE is required',
      );
    });

    it('should prepend OPTIMIZE_IMAGE to relative recipe images', async () => {
      mockLte.mockResolvedValueOnce({
        data: [
          {
            slug: 'apple-pie',
            title: 'Apple Pie',
            image: '/images/recipes/apple-pie.jpg',
            updated_at: '2026-08-01T12:00:00.000Z',
          },
        ],
        error: null,
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['OPTIMIZE_IMAGE'] = 'https://ik.imagekit.io/delishamarie';
      const res = await request(app).get('/sitemap-recipes.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain(
        '<image:loc>https://ik.imagekit.io/delishamarie/images/recipes/apple-pie.jpg</image:loc>',
      );
    });
  });

  describe('dynamic prefix and rewrite support', () => {
    it('should support /kitchen prefix on master sitemap', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/kitchen/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/kitchen/sitemap-pages.xml</loc>');
      expect(res.text).toContain(
        '<loc>https://custom-domain.com/kitchen/sitemap-categories.xml</loc>',
      );
      expect(res.text).toContain(
        '<loc>https://custom-domain.com/kitchen/sitemap-recipes.xml</loc>',
      );
    });

    it('should support arbitrary prefix on master sitemap', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/blog/v2/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/blog/v2/sitemap-pages.xml</loc>');
    });

    it('should support /kitchen prefix on recipes sitemap', async () => {
      mockLte.mockResolvedValueOnce({
        data: [
          {
            slug: 'chocolate-cake',
            title: 'Chocolate Cake',
            image: '/cake.jpg',
            updated_at: '2026-08-01T12:00:00.000Z',
          },
        ],
        error: null,
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['OPTIMIZE_IMAGE'] = 'https://ik.imagekit.io/delishamarie';
      const res = await request(app).get('/kitchen/sitemap-recipes.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain(
        '<loc>https://custom-domain.com/kitchen/recipe/chocolate-cake</loc>',
      );
      expect(res.text).toContain(
        '<image:loc>https://ik.imagekit.io/delishamarie/cake.jpg</image:loc>',
      );
    });

    it('should support rewrite via query param ?path=', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/api/sitemap?path=/kitchen/sitemap-pages.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/kitchen/recipe-index</loc>');
    });
  });

  it('should handle undefined req.url and req.headers.host', async () => {
    const req = { headers: {} } as unknown as VercelRequest;
    const res = { setHeader: vi.fn(), send: vi.fn() } as unknown as VercelResponse;
    await sitemapRouter(req, res);
    expect(res.send).toHaveBeenCalled();
  });

  it('should return 404 for unknown sitemap route', async () => {
    const req = { url: '/unknown.xml', headers: {} } as unknown as VercelRequest;
    const res = { setHeader: vi.fn(), send: vi.fn(), statusCode: 200 } as unknown as VercelResponse;
    await sitemapRouter(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should trim trailing slash from SITE_URL', async () => {
    process.env['SITE_URL'] = 'https://custom-domain.com/';
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-pages.xml</loc>');
  });

  it('should use request host and proto when SITE_URL and VERCEL envs are not set', async () => {
    delete process.env['SITE_URL'];
    delete process.env['VERCEL_ENV'];
    delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
    delete process.env['VERCEL_URL'];
    const res = await request(app)
      .get('/sitemap.xml')
      .set('host', 'my-custom-host:3000')
      .set('x-forwarded-proto', 'http');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<loc>http://my-custom-host:3000/sitemap-pages.xml</loc>');
  });

  describe('scalable recipe pagination and limits', () => {
    it('getRecipesPerSitemap respects limits and defaults', () => {
      delete process.env['RECIPES_PER_SITEMAP'];
      expect(getRecipesPerSitemap()).toBe(DEFAULT_RECIPES_PER_SITEMAP);
      expect(getRecipesPerSitemap()).toBe(1000);

      process.env['RECIPES_PER_SITEMAP'] = '2500';
      expect(getRecipesPerSitemap()).toBe(2500);

      process.env['RECIPES_PER_SITEMAP'] = '99999';
      expect(getRecipesPerSitemap()).toBe(MAX_RECIPES_PER_SITEMAP);
      expect(getRecipesPerSitemap()).toBe(50000);

      process.env['RECIPES_PER_SITEMAP'] = '-10';
      expect(getRecipesPerSitemap()).toBe(DEFAULT_RECIPES_PER_SITEMAP);

      process.env['RECIPES_PER_SITEMAP'] = 'invalid';
      expect(getRecipesPerSitemap()).toBe(DEFAULT_RECIPES_PER_SITEMAP);
    });

    it('should dynamically list multiple recipe chunks in master sitemap when count exceeds limit', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['RECIPES_PER_SITEMAP'] = '1000';
      mockLte.mockResolvedValueOnce({ count: 2500, data: [], error: null });

      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes-2.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes-3.xml</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/sitemap-recipes-1.xml</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/sitemap-recipes-4.xml</loc>');
    });

    it('should list single sitemap-recipes.xml in master sitemap when count is within limit', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['RECIPES_PER_SITEMAP'] = '1000';
      mockLte.mockResolvedValueOnce({ count: 500, data: [], error: null });

      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes.xml</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/sitemap-recipes-2.xml</loc>');
    });

    it('should handle master sitemap count error gracefully', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      mockLte.mockRejectedValueOnce(new Error('Count query failure'));

      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes.xml</loc>');
    });

    it('should support requesting /sitemap-recipes.xml as page 1 and /sitemap-recipes-2.xml as page 2', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['RECIPES_PER_SITEMAP'] = '2';

      mockLte.mockResolvedValueOnce({
        data: [
          { slug: 'recipe-1', title: 'Recipe 1' },
          { slug: 'recipe-2', title: 'Recipe 2' },
          { slug: 'recipe-3', title: 'Recipe 3' },
          { slug: 'recipe-4', title: 'Recipe 4' },
        ],
        error: null,
      });

      const resPage1 = await request(app).get('/sitemap-recipes.xml');
      expect(resPage1.status).toBe(200);
      expect(resPage1.text).toContain('<loc>https://custom-domain.com/recipe/recipe-1</loc>');
      expect(resPage1.text).toContain('<loc>https://custom-domain.com/recipe/recipe-2</loc>');
      expect(resPage1.text).not.toContain('<loc>https://custom-domain.com/recipe/recipe-3</loc>');

      mockLte.mockResolvedValueOnce({
        data: [
          { slug: 'recipe-1', title: 'Recipe 1' },
          { slug: 'recipe-2', title: 'Recipe 2' },
          { slug: 'recipe-3', title: 'Recipe 3' },
          { slug: 'recipe-4', title: 'Recipe 4' },
        ],
        error: null,
      });

      const resPage2 = await request(app).get('/sitemap-recipes-2.xml');
      expect(resPage2.status).toBe(200);
      expect(resPage2.text).toContain('<loc>https://custom-domain.com/recipe/recipe-3</loc>');
      expect(resPage2.text).toContain('<loc>https://custom-domain.com/recipe/recipe-4</loc>');
      expect(resPage2.text).not.toContain('<loc>https://custom-domain.com/recipe/recipe-1</loc>');
    });

    it('should return 404 for /sitemap-recipes-1.xml because numbering starts on 2', async () => {
      const res1 = await request(app).get('/sitemap-recipes-1.xml');
      expect(res1.status).toBe(404);
    });

    it('should support pagination via ?page= query parameter', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['RECIPES_PER_SITEMAP'] = '2';

      mockLte.mockResolvedValueOnce({
        data: [{ slug: 'recipe-1' }, { slug: 'recipe-2' }, { slug: 'recipe-3' }],
        error: null,
      });

      const res = await request(app).get('/sitemap-recipes.xml?page=2');
      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe/recipe-3</loc>');
    });

    it('should return 404 for invalid page number like 0 or negative', async () => {
      const res0 = await request(app).get('/sitemap-recipes-0.xml');
      expect(res0.status).toBe(404);

      const resInvalid = await request(app).get('/sitemap-recipes.xml?page=-1');
      expect(resInvalid.status).toBe(404);
    });

    it('should invoke order and range when provided on query builder', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const mockRange = vi.fn().mockResolvedValue({
        data: [{ slug: 'ranged-cake' }],
        error: null,
      });
      const mockOrderSlug = vi.fn().mockReturnValue({ range: mockRange });
      const mockOrderDate = vi.fn().mockReturnValue({ order: mockOrderSlug });

      mockLte.mockReturnValueOnce({
        order: mockOrderDate,
      });

      const res = await request(app).get('/sitemap-recipes-2.xml');
      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe/ranged-cake</loc>');
      expect(mockOrderDate).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockOrderSlug).toHaveBeenCalledWith('slug', { ascending: true });
      expect(mockRange).toHaveBeenCalledWith(1000, 1999);
    });

    it('should return 404 when page requested is beyond total recipes', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      mockLte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const res = await request(app).get('/sitemap-recipes-99.xml');
      expect(res.status).toBe(404);
    });

    it('should support kitchen prefix with paginated chunks', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      mockLte.mockResolvedValueOnce({
        data: [{ slug: 'kitchen-pie' }],
        error: null,
      });

      const res = await request(app).get('/kitchen/sitemap-recipes-2.xml');
      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/kitchen/recipe/kitchen-pie</loc>');
    });

    it('should support page 10 and beyond when requesting /sitemap-recipes-10.xml', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const mockRange = vi.fn().mockResolvedValue({
        data: [{ slug: 'recipe-page-10' }],
        error: null,
      });
      const mockOrderSlug = vi.fn().mockReturnValue({ range: mockRange });
      const mockOrderDate = vi.fn().mockReturnValue({ order: mockOrderSlug });

      mockLte.mockReturnValueOnce({
        order: mockOrderDate,
      });

      const res = await request(app).get('/sitemap-recipes-10.xml');
      expect(res.status).toBe(200);
      expect(mockRange).toHaveBeenCalledWith(9000, 9999);
    });

    it('should list all chunks in master sitemap when there are 10 or more pages', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['RECIPES_PER_SITEMAP'] = '1000';
      mockLte.mockResolvedValueOnce({ count: 12000, data: [], error: null });

      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes-2.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes-9.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes-10.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes-11.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-recipes-12.xml</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/sitemap-recipes-13.xml</loc>');
    });

    it('should omit sitemap-recipes.xml in master sitemap when recipe count is 0', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      mockLte.mockResolvedValueOnce({ count: 0, data: [], error: null });

      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-pages.xml</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/sitemap-categories.xml</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/sitemap-recipes.xml</loc>');
    });

    it('should handle items with empty or whitespace-only slugs or urls in taxonomies', async () => {
      mockFrom.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {
          select: vi.fn().mockImplementation(() => builder),
          eq: vi.fn().mockImplementation(() => builder),
          lte: vi.fn().mockImplementation(() => {
            if (table === 'categories') {
              return Promise.resolve({
                data: [{ url: null }, { url: '   ' }, { url: 'recipes' }, { url: 'dinner' }],
                error: null,
              });
            }
            if (table === 'holidays') {
              return Promise.resolve({
                data: [{ slug: null }, { slug: '' }],
                error: null,
              });
            }
            return Promise.resolve({ data: null, count: 0, error: null });
          }),
        };
        return builder;
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-categories.xml');

      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/dinner</loc>');
      expect(res.text).not.toContain('<loc>https://custom-domain.com/holidays');
    });

    it('should return 404 when database query fails for page >= 2', async () => {
      mockLte.mockRejectedValueOnce(new Error('Pagination DB failure'));

      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-recipes-2.xml');
      expect(res.status).toBe(404);
    });

    it('should handle query builder when order does not return second order function', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const mockOrderDate = vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: [{ slug: 'single-order-cake' }],
          error: null,
        }),
      });

      mockLte.mockReturnValueOnce({
        order: mockOrderDate,
      });

      const res = await request(app).get('/sitemap-recipes-2.xml');
      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe/single-order-cake</loc>');
    });

    it('should format relative recipe image using OPTIMIZE_IMAGE via buildRecipeImageTag', async () => {
      mockLte.mockResolvedValueOnce({
        data: [
          {
            slug: 'relative-img-cake',
            title: 'Cake',
            image: '/images/relative-cake.jpg',
            updated_at: '2026-08-01T12:00:00.000Z',
          },
        ],
        error: null,
      });

      process.env['SITE_URL'] = 'https://custom-domain.com';
      process.env['OPTIMIZE_IMAGE'] = 'https://ik.imagekit.io/delishamarie';
      const res = await request(app).get('/sitemap-recipes.xml');
      expect(res.status).toBe(200);
      expect(res.text).toContain(
        '<image:loc>https://ik.imagekit.io/delishamarie/images/relative-cake.jpg</image:loc>',
      );
    });

    it('should handle query builder without range function', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      mockLte.mockReturnValueOnce({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ slug: 'no-range-cake' }],
            error: null,
          }),
        }),
      });

      const res = await request(app).get('/sitemap-recipes-2.xml');
      expect(res.status).toBe(200);
      expect(res.text).toContain('<loc>https://custom-domain.com/recipe/no-range-cake</loc>');
    });
  });
});
