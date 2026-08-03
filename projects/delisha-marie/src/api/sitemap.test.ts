import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import express from 'express';
import request from 'supertest';
import sitemapRouter from './sitemap';
import { resetSupabaseClient } from './supabase';

describe('Sitemap Router API', () => {
  let app: express.Express;
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['SUPABASE_KEY'] = 'test-key';
    delete process.env['SITE_URL'];
    resetSupabaseClient();

    app = express();
    app.use(sitemapRouter);

    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  afterEach(() => {
    process.env = originalEnv;
    resetSupabaseClient();
  });

  describe('GET /sitemap.xml', () => {
    it('should return master sitemap index XML', async () => {
      const res = await request(app).get('/sitemap.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.headers['cache-control']).toContain('public, max-age=3600');
      expect(res.text).toContain(
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      expect(res.text).toContain('<loc>https://delishamarie.com/sitemap-pages.xml</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/sitemap-categories.xml</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/sitemap-recipes.xml</loc>');
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
      const res = await request(app).get('/sitemap-pages.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<loc>https://delishamarie.com/</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/recipe-index</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/faq</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/about</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/contact</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/privacy-policy</loc>');
      expect(res.text).toContain('<changefreq>monthly</changefreq>');
      expect(res.text).toContain('<changefreq>yearly</changefreq>');
    });
  });

  describe('GET /sitemap-categories.xml', () => {
    it('should return category hub pages XML', async () => {
      const res = await request(app).get('/sitemap-categories.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<loc>https://delishamarie.com/recipes</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/methods</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/holidays</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/special-diets</loc>');
      expect(res.text).toContain('<loc>https://delishamarie.com/the-best-recipes</loc>');
    });
  });

  describe('GET /sitemap-recipes.xml', () => {
    it('should return dynamic recipe URLs with image tags and escaped XML', async () => {
      mockEq.mockResolvedValueOnce({
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
        ],
        error: null,
      });

      const res = await request(app).get('/sitemap-recipes.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<loc>https://delishamarie.com/recipe/chocolate-cake</loc>');
      expect(res.text).toContain('<lastmod>2026-08-01</lastmod>');
      expect(res.text).toContain('<image:loc>https://example.com/cake.jpg?a=1&amp;b=2</image:loc>');
      expect(res.text).toContain('<image:title>Chocolate &amp; Caramel Cake</image:title>');
      expect(res.text).toContain('<loc>https://delishamarie.com/recipe/simple-bread</loc>');
      expect(res.text).toContain('<lastmod>2026-07-15</lastmod>');
    });

    it('should handle database exception gracefully', async () => {
      mockEq.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/sitemap-recipes.xml');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    });
  });
});
