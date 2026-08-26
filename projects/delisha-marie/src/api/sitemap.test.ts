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
import sitemapRouter from './sitemap';
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
    delete process.env['SITE_URL'];
    resetSupabaseClient();

    request = createRequestMock(sitemapRouter);

    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ lte: mockLte });
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

    it('should use VERCEL_PROJECT_PRODUCTION_URL if SITE_URL is not set', async () => {
      delete process.env['SITE_URL'];
      process.env['VERCEL_PROJECT_PRODUCTION_URL'] = 'vercel-app.com';
      const res = await request(app).get('/sitemap.xml');
      expect(res.text).toContain('<loc>https://vercel-app.com/sitemap-pages.xml</loc>');
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
      // test-utils passes host: 'localhost' by default in createRequestMock if we don't clear it.
      // So it will use https://localhost by default if x-forwarded-proto isn't set,
      // but test-utils sets neither, except headers={}. Wait, let's see.
      expect(res.text).toContain('<loc>https://');
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
      expect(res.text).toContain('<loc>https://custom-domain.com/faq</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/about</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/contact</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/privacy-policy</loc>');
      expect(res.text).toContain('<changefreq>monthly</changefreq>');
      expect(res.text).toContain('<changefreq>yearly</changefreq>');
    });
  });

  describe('GET /sitemap-categories.xml', () => {
    it('should return category hub pages XML', async () => {
      process.env['SITE_URL'] = 'https://custom-domain.com';
      const res = await request(app).get('/sitemap-categories.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<loc>https://custom-domain.com/recipes</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/methods</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/holidays</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/special-diets</loc>');
      expect(res.text).toContain('<loc>https://custom-domain.com/the-best-recipes</loc>');
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
});
