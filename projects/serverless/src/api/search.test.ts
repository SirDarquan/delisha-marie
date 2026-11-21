import type { VercelRequest, VercelResponse } from '@vercel/node';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockInvoke, mockFrom, mockLte } = vi.hoisted(() => {
  const mockLte = vi.fn();
  const mockEq = vi.fn(() => ({ lte: mockLte }));
  const mockIn = vi.fn(() => ({ eq: mockEq }));
  const mockSelect = vi.fn(() => ({ in: mockIn }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  const mockInvoke = vi.fn();
  return { mockInvoke, mockFrom, mockLte };
});

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      functions: {
        invoke: mockInvoke,
      },
      from: mockFrom,
    })),
  };
});

import { createRequestMock } from './test-utils';
import searchRouter, {
  resolveSearchProvider,
  algoliaSearchProvider,
  supabaseSearchProvider,
} from './search';
import { resetSupabaseClient } from './supabase';

vi.spyOn(console, 'error').mockImplementation(vi.fn());

const request = createRequestMock(searchRouter);
const app = null;

describe('Search Router API', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
    process.env = { ...originalEnv };
    delete process.env['SEARCH_PROVIDER'];
    delete process.env['ALGOLIA_APP_ID'];
    delete process.env['ALGOLIA_API_KEY'];
    delete process.env['ALGOLIA_INDEX_NAME'];
    delete process.env['ALGOLIA_TENANT_ID'];
    mockLte.mockResolvedValue({ data: [{ id: 1 }], error: null });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('resolveSearchProvider', () => {
    it('should return algoliaSearchProvider when SEARCH_PROVIDER is algolia', () => {
      process.env['SEARCH_PROVIDER'] = 'algolia';
      expect(resolveSearchProvider()).toBe(algoliaSearchProvider);
    });

    it('should return supabaseSearchProvider when SEARCH_PROVIDER is supabase', () => {
      process.env['SEARCH_PROVIDER'] = 'supabase';
      process.env['ALGOLIA_APP_ID'] = 'test-id';
      process.env['ALGOLIA_API_KEY'] = 'test-key';
      expect(resolveSearchProvider()).toBe(supabaseSearchProvider);
    });

    it('should auto-detect algoliaSearchProvider when credentials are set', () => {
      process.env['ALGOLIA_APP_ID'] = 'test-id';
      process.env['ALGOLIA_API_KEY'] = 'test-key';
      expect(resolveSearchProvider()).toBe(algoliaSearchProvider);
    });

    it('should default to supabaseSearchProvider when no Algolia env vars are present', () => {
      expect(resolveSearchProvider()).toBe(supabaseSearchProvider);
    });
  });

  describe('POST /api/search with Supabase Provider', () => {
    it('should return recipes successfully', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          recipes: [{ id: 1, title: 'Test', status: 'published', total_count: 5 }],
          total: 1,
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/search')
        .send({ query: 'test', page: 1, pageSize: 12 });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toEqual({ id: 1, title: 'Test', status: 'published' });
      expect(res.body.total).toBe(1);
      expect(mockInvoke).toHaveBeenCalledWith('search-recipes', {
        body: { query: 'test', page: 1, pageSize: 12 },
      });
      expect(mockFrom).toHaveBeenCalledWith('recipes');
    });

    it('should filter out future-scheduled recipes (like waffle) not returned by live database query', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          recipes: [
            { id: 1, title: 'Live Recipe', status: 'published', total_count: 2 },
            { id: 2, title: 'Waffle', status: 'published', total_count: 2 },
          ],
          total: 2,
        },
        error: null,
      });
      mockLte.mockResolvedValue({ data: [{ id: 1 }], error: null });

      const res = await request(app)
        .post('/api/search')
        .send({ query: 'waffle', page: 1, pageSize: 12 });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toEqual({ id: 1, title: 'Live Recipe', status: 'published' });
      expect(res.body.total).toBe(1);
    });

    it('should filter out scheduled recipes whose created_at is in the future even if in validIdSet', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          recipes: [
            { id: 1, title: 'Live Recipe', status: 'published' },
            {
              id: 2,
              title: 'Future Recipe',
              status: 'published',
              created_at: '2099-01-01T00:00:00Z',
            },
          ],
          total: 2,
        },
        error: null,
      });
      mockLte.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], error: null });

      const res = await request(app)
        .post('/api/search')
        .send({ query: 'recipe', page: 1, pageSize: 12 });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(1);
      expect(res.body.total).toBe(1);
    });

    it('should filter out recipes with non-published status', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          recipes: [
            { id: 1, title: 'Live Recipe', status: 'published' },
            { id: 2, title: 'Draft Recipe', status: 'draft' },
          ],
          total: 2,
        },
        error: null,
      });
      mockLte.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], error: null });

      const res = await request(app)
        .post('/api/search')
        .send({ query: 'recipe', page: 1, pageSize: 12 });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(1);
      expect(res.body.total).toBe(1);
    });

    it('should return 500 when database verification query fails', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          recipes: [{ id: 1, title: 'Recipe', status: 'published' }],
          total: 1,
        },
        error: null,
      });
      mockLte.mockResolvedValue({ data: null, error: new Error('DB verification query error') });

      const res = await request(app).post('/api/search').send({ query: 'test' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB verification query error');
    });

    it('should handle null liveRecipes data gracefully', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          recipes: [{ id: 1, title: 'Recipe', status: 'published' }],
          total: 1,
        },
        error: null,
      });
      mockLte.mockResolvedValue({ data: null, error: null });

      const res = await request(app).post('/api/search').send({ query: 'test' });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('should handle recipes without valid IDs without querying database', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          recipes: [{ title: 'No ID Recipe' }],
          total: 1,
        },
        error: null,
      });

      const res = await request(app).post('/api/search').send({ query: 'test' });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return recipes successfully with default pagination if not provided', async () => {
      mockInvoke.mockResolvedValue({
        data: { recipes: [], total: 0 },
        error: null,
      });

      const res = await request(app).post('/api/search').send({ query: 'test' });

      expect(res.status).toBe(200);
      expect(mockInvoke).toHaveBeenCalledWith('search-recipes', {
        body: { query: 'test', page: 1, pageSize: 12 },
      });
    });

    it('should return 400 if query is missing', async () => {
      const res = await request(app).post('/api/search').send({ page: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Query is required');
    });

    it('should return 500 if edge function returns an error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: new Error('Edge function failed'),
      });

      const res = await request(app).post('/api/search').send({ query: 'test' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Edge function failed');
    });

    it('should return 500 if edge function returns a string error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: 'String error',
      });

      const res = await request(app).post('/api/search').send({ query: 'test' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('String error');
    });

    it('should return 500 if supabase throws exception', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const res = await request(app).post('/api/search').send({ query: 'test' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Network error');
    });

    it('should handle missing data properties correctly', async () => {
      mockInvoke.mockResolvedValue({
        data: {},
        error: null,
      });

      const res = await request(app).post('/api/search').send({ query: 'test' });
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('should return 400 if req.body is missing entirely', async () => {
      const res = await request(app).post('/api/search').send();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Query is required');
    });

    it('should handle undefined req.body', async () => {
      const req = { method: 'POST', body: null };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      await searchRouter(req as unknown as VercelRequest, res as unknown as VercelResponse);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 405 if method is not POST', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(405);
      expect(res.body.error).toBe('Method not allowed');
    });
  });

  describe('POST /api/search with Algolia Provider', () => {
    beforeEach(() => {
      process.env['SEARCH_PROVIDER'] = 'algolia';
      process.env['ALGOLIA_APP_ID'] = 'mock-app-id';
      process.env['ALGOLIA_API_KEY'] = 'mock-api-key';
      process.env['ALGOLIA_INDEX_NAME'] = 'mock_recipe_index';
      process.env['ALGOLIA_TENANT_ID'] = 'mock-tenant-id';
    });

    it('should successfully search Algolia and map hits to SearchResultRecipe format', async () => {
      const mockHits = [
        {
          objectID: 'recipe_001',
          tenant_id: 'mock-tenant-id',
          status: 'published',
          created_at: 1763580000,
          title: 'Spaghetti Carbonara',
          slug: 'spaghetti-carbonara',
          image: '/images/carbonara.jpg',
          description: 'A classic pasta',
          ingredients: ['pasta', 'eggs', 'pancetta', 'parmesan'],
          cook_time: 25,
          difficulty: 'medium',
        },
        {
          objectID: 'recipe_002',
          id: 'custom_id_002',
          tenant_id: 'mock-tenant-id',
          status: 'published',
          created_at: 1763581200,
          title: 'Mushroom Risotto',
          slug: 'mushroom-risotto',
          image: '/images/risotto.jpg',
          description: 'Creamy risotto',
        },
      ];

      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: mockHits,
          page: 0,
          hitsPerPage: 12,
          nbHits: 58,
          nbPages: 5,
        }),
      } as Response);

      const res = await request(app)
        .post('/api/search')
        .send({ query: 'Creamy', page: 1, pageSize: 12 });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(58);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].id).toBe('recipe_001');
      expect(res.body.items[0].slug).toBe('spaghetti-carbonara');
      expect(res.body.items[0].image).toBe('/images/carbonara.jpg');
      expect(res.body.items[1].id).toBe('custom_id_002');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toBe('https://mock-app-id.algolia.net/1/indexes/mock_recipe_index/query');

      const headers = requestInit?.headers as Record<string, string>;
      expect(headers['x-algolia-application-id']).toBe('mock-app-id');
      expect(headers['x-algolia-api-key']).toBe('mock-api-key');
      expect(headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(requestInit?.body as string);
      expect(body.query).toBe('Creamy');
      expect(body.page).toBe(0); // 1-indexed page 1 converted to 0
      expect(body.hitsPerPage).toBe(12);
      expect(body.sortFacetValuesBy).toBeUndefined();
      expect(body.filters).toContain("tenant_id:'mock-tenant-id'");
      expect(body.filters).toContain('status:published');
    });

    it('should convert page 2 to page 1 for zero-indexed Algolia queries', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ hits: [{ id: '1', status: 'published' }], nbHits: 1 }),
      } as Response);

      const res = await request(app)
        .post('/api/search')
        .send({ query: 'Pasta', page: 2, pageSize: 6 });

      expect(res.status).toBe(200);
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.page).toBe(1);
      expect(body.hitsPerPage).toBe(6);
    });

    it('should respect custom tenantId from request body if passed', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ hits: [{ id: '1', status: 'published' }], nbHits: 1 }),
      } as Response);

      await request(app).post('/api/search').send({ query: 'Pasta', tenantId: 'tenant-abc-123' });

      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.filters).toContain("tenant_id:'tenant-abc-123'");
    });

    it('should omit tenant_id from filters when not configured', async () => {
      delete process.env['ALGOLIA_TENANT_ID'];
      delete process.env['TENANT_ID'];

      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ hits: [{ id: '1', status: 'published' }], nbHits: 1 }),
      } as Response);

      await request(app).post('/api/search').send({ query: 'Pasta' });

      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.filters).not.toContain('tenant_id');
      expect(body.filters).toContain('status:published');
    });

    it('should filter out hits whose created_at is in the future (ISO string or unix number)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: [
            { id: '1', title: 'Past ISO Recipe', created_at: '2024-01-01T00:00:00Z' },
            { id: '2', title: 'Future ISO Recipe', created_at: '2099-01-01T00:00:00Z' },
            { id: '3', title: 'Future Unix Recipe', created_at: 4070908800 },
          ],
          nbHits: 3,
        }),
      } as Response);

      const res = await request(app).post('/api/search').send({ query: 'Pasta' });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe('1');
      expect(res.body.total).toBe(1);
    });

    it('should return 500 when Algolia API responds with an error status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Invalid API key',
      } as Response);

      const res = await request(app).post('/api/search').send({ query: 'Creamy' });
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Algolia query failed with status 403: Invalid API key');
    });

    it('should return 500 if Algolia credentials are missing', async () => {
      delete process.env['ALGOLIA_APP_ID'];

      const res = await request(app).post('/api/search').send({ query: 'Creamy' });
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Algolia App ID and API Key are required');
    });

    it('should handle empty hits gracefully and default total to 0', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const res = await request(app).post('/api/search').send({ query: 'Notfound' });
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });

    it('should allow empty string query and return matching items', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: [{ id: 'all_1', title: 'Recipe 1', status: 'published' }],
          nbHits: 1,
        }),
      } as Response);

      const res = await request(app).post('/api/search').send({ query: '' });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it('should use default index name and handle hits without id or objectID', async () => {
      delete process.env['ALGOLIA_INDEX_NAME'];

      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: [
            {
              objectID: 'pub_1',
              title: 'Published Recipe',
              status: 'published',
              tenant_id: 'mock-tenant-id',
            },
            {
              title: 'No ID Recipe',
            },
          ],
          nbHits: 2,
        }),
      } as Response);

      const result = await algoliaSearchProvider.search({ query: 'Creamy' });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain('/supabase_recipe_index/query');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('pub_1');
      expect(result.items[1].id).toBe('');
      expect(result.total).toBe(2);
    });

    it('should default page and pageSize to 1 and 12 when non-numeric values are passed to handler', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: [{ id: '1', status: 'published' }],
          nbHits: 1,
        }),
      } as Response);

      const res = await request(app)
        .post('/api/search')
        .send({ query: 'Creamy', page: 0, pageSize: 0 });
      expect(res.status).toBe(200);
    });
  });
});
