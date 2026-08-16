import { SupabaseClient, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Ensure Env vars exist before static initialization in imported modules
vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

// 1. Explicitly declare mock functions outside to track calls
const {
  mockFrom,
  mockSelect,
  mockOrder,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockEq,
  mockSingle,
  mockMaybeSingle,
  mockUpsert,
  mockLimit,
  mockRange,
  mockIlike,
  mockIn,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockUpsert: vi.fn(),
  mockLimit: vi.fn(),
  mockRange: vi.fn(),
  mockIlike: vi.fn(),
  mockIn: vi.fn(),
}));

// 2. Setup the chain linkages
const mockChain = {
  from: mockFrom,
  select: mockSelect,
  order: mockOrder,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  upsert: mockUpsert,
  limit: mockLimit,
  range: mockRange,
  ilike: mockIlike,
  in: mockIn,
  then: (resolve: (val: { data: null; error: null }) => void) =>
    resolve({ data: null, error: null }),
};

import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import recipesRouter from './recipes';
import { backendService } from './supabase-backend.service';

// Instrument backendService methods so they can be mocked dynamically
vi.spyOn(backendService, 'getClient');
vi.spyOn(backendService, 'verifyToken');

describe('Recipes Router API', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.resetAllMocks();

    // Reset default chain return values before each test run
    mockFrom.mockReturnValue(mockChain);
    mockSelect.mockReturnValue(mockChain);
    mockOrder.mockReturnValue(mockChain);
    mockInsert.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
    mockDelete.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockLimit.mockReturnValue(mockChain);
    mockRange.mockReturnValue(mockChain);
    mockIlike.mockReturnValue(mockChain);
    mockIn.mockReturnValue(mockChain);
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ data: null, error: null });
    mockChain.then = vi
      .fn()
      .mockImplementation(<T>(resolve: (val: T) => void) =>
        resolve({ data: null, error: null } as unknown as T),
      );

    vi.mocked(backendService.getClient).mockReturnValue({
      from: mockFrom,
    } as unknown as SupabaseClient);

    // Mock verifyToken to immediately succeed and inject user context
    vi.mocked(backendService.verifyToken).mockResolvedValue({
      username: 'test-user',
      email: 'test@example.com',
    } as unknown as User);

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Inject token cookie in requests to pass authMiddleware
    app.use((req, _res, next) => {
      req.cookies = { admin_access_token: 'test-token-xyz' };
      next();
    });

    app.use(recipesRouter);
  });

  describe('GET /recipes', () => {
    it('should successfully return all recipes', async () => {
      const mockList = [{ id: 'recipe-1', title: 'Salad', updated_at: new Date().toISOString() }];
      mockRange.mockResolvedValueOnce({ data: mockList, error: null });

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      mockChain.then = vi.fn().mockImplementation(<T>(resolve: (val: T) => void) =>
        resolve({
          data: [
            {
              recipe_id: 'recipe-1',
              parent_id: null,
              created_at: threeDaysAgo,
              is_new: true,
              status: 'approved',
            },
            {
              recipe_id: 'recipe-1',
              parent_id: null,
              created_at: eightDaysAgo,
              is_new: false,
              status: 'approved',
            },
            {
              recipe_id: 'recipe-1',
              parent_id: 'some-id',
              created_at: threeDaysAgo,
              is_new: false,
              status: 'skipped',
            },
            {
              recipe_id: 'recipe-1',
              parent_id: 'some-id',
              created_at: threeDaysAgo,
              is_new: true,
              status: 'approved',
            },
          ],
          error: null,
        } as unknown as T),
      );

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          id: 'recipe-1',
          title: 'Salad',
          topCommentsCount: 2,
          newCommentsCount: 2,
        }),
      ]);
      expect(backendService.getClient).toHaveBeenCalledWith('test-token-xyz');
      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockSelect).toHaveBeenCalledWith(
        '*, recipe_holidays (holidays (name)), recipe_special_diets (special_diets (name))',
      );
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(0, 999);
    });

    it('should return 500 when fetching recipes throws an error', async () => {
      mockRange.mockResolvedValueOnce({ data: null, error: new Error('Database error') });

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
    });

    it('should handle non-string status and dates in fetchAllRecipes', async () => {
      mockRange.mockResolvedValueOnce({
        data: [
          { id: '1', status: null, updated_at: null },
          { id: '2', status: 123, updated_at: 456 },
          { id: '3' },
        ],
        error: null,
      });

      const res = await request(app).get('/recipes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
    });

    it('should successfully return paginated recipes with search', async () => {
      const mockSkeleton = [
        { id: 'recipe-1', status: 'published', updated_at: '2026-06-01T00:00:00Z' },
        { id: 'recipe-2', status: 'published', updated_at: '2026-06-02T00:00:00Z' },
        { id: 'recipe-3', status: 'draft', updated_at: '2026-06-03T00:00:00Z' },
      ];
      // Skeleton query
      mockSelect.mockReturnValueOnce(mockChain);
      mockIlike.mockReturnValue(mockChain);
      mockChain.then = vi
        .fn()
        .mockImplementationOnce((resolve) => resolve({ data: mockSkeleton, error: null }))
        .mockImplementation((resolve) => resolve({ data: null, error: null } as never));

      // Page query
      mockSelect.mockReturnValueOnce(mockChain);
      mockIn.mockResolvedValueOnce({
        data: [
          {
            id: 'recipe-1',
            title: 'Burritos',
            status: 'published',
            recipe_holidays: [{ holidays: { name: 'Christmas' } }],
            recipe_special_diets: [{ special_diets: { name: 'Vegan' } }],
          },
          {
            id: 'recipe-2',
            title: 'Tacos',
            status: 'draft',
            recipe_holidays: [{ holidays: { name: 'Cinco de Mayo' } }],
            recipe_special_diets: [{ special_diets: { name: 'Gluten-Free' } }],
          },
        ],
        error: null,
      });

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      // Comments query
      mockIn.mockResolvedValueOnce({
        data: [
          { recipe_id: 'recipe-1', parent_id: null, created_at: threeDaysAgo, status: 'approved' },
          { recipe_id: 'recipe-1', parent_id: null, created_at: eightDaysAgo, status: 'approved' },
          {
            recipe_id: 'recipe-1',
            parent_id: 'some-id',
            created_at: threeDaysAgo,
            status: 'skipped',
          },
          { recipe_id: 'recipe-2', parent_id: null, created_at: threeDaysAgo, status: 'approved' },
        ],
        error: null,
      });

      const res = await request(app).get('/recipes?offset=0&limit=1&search=taco');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[1].title).toBe('Tacos');
      expect(res.body[1].holidays).toContain('Cinco de Mayo');
      expect(mockIlike).toHaveBeenCalledWith('title', '%taco%');
    });

    it('should handle skeleton error in paginated query', async () => {
      mockSelect.mockReturnValueOnce(mockChain);
      mockChain.then = vi
        .fn()
        .mockImplementationOnce((resolve) =>
          resolve({ data: null, error: new Error('Skeleton error') }),
        );

      const res = await request(app).get('/recipes?offset=0&limit=10');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Skeleton error');
    });

    it('should return empty array if pageIds is empty', async () => {
      mockSelect.mockReturnValueOnce(mockChain);
      mockChain.then = vi
        .fn()
        .mockImplementationOnce((resolve) => resolve({ data: [], error: null }));

      const res = await request(app).get('/recipes?offset=0&limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should successfully return paginated recipes with no results and handle non-string statuses', async () => {
      // Skeleton query with non-string fields
      mockSelect.mockReturnValueOnce(mockChain);
      mockIlike.mockReturnValue(mockChain);
      mockChain.then = vi.fn().mockImplementationOnce((resolve) =>
        resolve({
          data: [
            { id: '1', status: null, updated_at: null },
            { id: '2', status: 123, updated_at: 123 },
          ],
          error: null,
        }),
      );

      // Simulate a slice that evaluates to empty
      const res = await request(app).get('/recipes?offset=500&limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle null pageData in fetchPaginatedRecipes', async () => {
      // Skeleton query
      mockSelect.mockReturnValueOnce(mockChain);
      mockChain.then = vi
        .fn()
        .mockImplementationOnce((resolve) =>
          resolve({ data: [{ id: '1', status: 'draft', updated_at: '2026-06-03' }], error: null }),
        );

      // Page query returning null data
      mockSelect.mockReturnValueOnce(mockChain);
      mockIn.mockReturnValueOnce(mockChain);
      mockChain.then = vi
        .fn()
        .mockImplementationOnce((resolve) => resolve({ data: null, error: null }));

      const res = await request(app).get('/recipes?offset=0&limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle page error in paginated query', async () => {
      mockSelect.mockReturnValueOnce(mockChain);
      mockChain.then = vi
        .fn()
        .mockImplementationOnce((resolve) => resolve({ data: [{ id: '1' }], error: null }));

      mockSelect.mockReturnValueOnce(mockChain);
      mockChain.in = vi.fn().mockResolvedValueOnce({ data: null, error: new Error('Page error') });

      const res = await request(app).get('/recipes?offset=0&limit=10');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Page error');
    });

    it('should handle database error', async () => {
      mockSelect.mockReturnValueOnce(mockChain);
      mockOrder.mockReturnValueOnce(mockChain);
      mockRange.mockReturnValueOnce(mockChain);
      mockChain.then = <T>(resolve: (val: T) => void) =>
        resolve({ data: null, error: new Error('Database error') } as unknown as T);

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
    });

    it('should sort recipes by status and updatedAt correctly', async () => {
      const mockList = [
        {
          id: '1',
          status: 'draft',
          updated_at: '2026-06-02T00:00:00Z',
          recipe_holidays: [{ holidays: { name: 'A' } }],
        },
        {
          id: '2',
          status: 'published',
          updated_at: '2026-06-01T00:00:00Z',
          recipe_special_diets: [{ special_diets: { name: 'B' } }],
        },
        { id: '3', status: 'published', updated_at: '2026-06-05T00:00:00Z' },
        { id: '4', status: null, updated_at: null },
      ];
      mockSelect.mockReturnValueOnce(mockChain);
      mockOrder.mockReturnValueOnce(mockChain);
      mockChain.then = <T>(resolve: (val: T) => void) =>
        resolve({ data: mockList, error: null } as unknown as T);

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(200);
      expect(res.body.map((r: Record<string, unknown>) => r['id'])).toEqual(['1', '3', '2', '4']);
    });

    it('should cover massive branches for GET /recipes', async () => {
      // 1. limit without offset, offset without limit
      mockSelect.mockReturnValue(mockChain);
      mockOrder.mockReturnValue(mockChain);
      mockRange.mockReturnValue(mockChain);

      const messyData = [
        {
          id: '1',
          status: 'invalid_status', // branch 43-54
          recipe_holidays: [null, {}], // branch 87
          recipe_special_diets: [null, {}], // branch 89
        },
        {
          id: '2',
          status: 'invalid_status', // identical status
          recipe_holidays: [],
          recipe_special_diets: [],
        },
      ];

      mockChain.then = vi
        .fn()
        .mockImplementationOnce(<T>(resolve: (val: T) => void) =>
          resolve({ data: messyData, error: null } as unknown as T),
        );
      await request(app).get('/recipes?limit=1');

      mockChain.then = vi
        .fn()
        .mockImplementationOnce(<T>(resolve: (val: T) => void) =>
          resolve({ data: messyData, error: null } as unknown as T),
        );
      await request(app).get('/recipes?offset=0');

      // pageData is null
      mockChain.then = vi
        .fn()
        .mockImplementationOnce(<T>(resolve: (val: T) => void) =>
          resolve({ data: null, error: null } as unknown as T),
        )
        .mockImplementation(<T>(resolve: (val: T) => void) =>
          resolve({ data: null, error: null } as unknown as T),
        );
      const res3 = await request(app).get('/recipes?limit=1');
      expect(res3.status).toBe(200);
    });

    it('should cover pagination fallback branches with null data', async () => {
      mockChain.then = vi
        .fn()
        .mockImplementationOnce(<T>(resolve: (val: T) => void) =>
          resolve({ data: null, error: null } as unknown as T),
        )
        .mockImplementation(<T>(resolve: (val: T) => void) =>
          resolve({ data: null, error: null } as unknown as T),
        );
      const res = await request(app).get('/recipes');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should cover pagination fallback with messy data', async () => {
      const messyData = [
        {
          id: '1',
          recipe_holidays: [null, {}],
          recipe_special_diets: [null, {}],
        },
      ];
      mockChain.then = vi
        .fn()
        .mockImplementationOnce(<T>(resolve: (val: T) => void) =>
          resolve({ data: messyData, error: null } as unknown as T),
        )
        .mockImplementation(<T>(resolve: (val: T) => void) =>
          resolve({ data: null, error: null } as unknown as T),
        );
      const res = await request(app).get('/recipes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should fetch multiple batches if fallback returns 1000 items', async () => {
      const batch1 = Array.from({ length: 1000 }).map((_, i) => ({
        id: `id-${i}`,
        status: 'published',
      }));
      const batch2 = [{ id: 'id-1000', status: 'published' }];

      mockSelect.mockReturnValue(mockChain);
      mockOrder.mockReturnValue(mockChain);
      mockRange.mockReturnValue(mockChain);

      mockChain.then = vi
        .fn()
        .mockImplementationOnce(<T>(resolve: (val: T) => void) =>
          resolve({ data: batch1, error: null } as unknown as T),
        )
        .mockImplementationOnce(<T>(resolve: (val: T) => void) =>
          resolve({ data: batch2, error: null } as unknown as T),
        )
        .mockImplementation(<T>(resolve: (val: T) => void) =>
          resolve({ data: null, error: null } as unknown as T),
        );

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1001);
    });
  });

  describe('GET /home', () => {
    it('should successfully return home stats', async () => {
      mockSelect.mockReturnValueOnce({
        then: (resolve: (val: unknown) => void) => resolve({ count: 12, error: null }),
      });

      const mockRecent = [
        {
          id: 'r-1',
          title: 'Recipe 1',
          prep_time: '10 mins',
          author: 'Chef A',
          created_at: '2026-06-29T10:00:00Z',
          recipe_categories: [{ categories: { name: 'Dessert' } }],
        },
      ];
      mockLimit.mockResolvedValueOnce({ data: mockRecent, error: null });

      const res = await request(app).get('/home');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalRecipes: 12,
        recentRecipes: [
          {
            id: 'r-1',
            title: 'Recipe 1',
            prepTime: '10 mins',
            author: 'Chef A',
            category: 'Dessert',
            createdAt: '2026-06-29T10:00:00Z',
          },
        ],
      });
      expect(mockFrom).toHaveBeenNthCalledWith(1, 'recipes');
      expect(mockSelect).toHaveBeenNthCalledWith(1, '*', { count: 'exact', head: true });
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'recipes');
      expect(mockSelect).toHaveBeenNthCalledWith(
        2,
        `
        id,
        title,
        prep_time,
        author,
        created_at,
        recipe_categories (
          categories (name)
        )
      `,
      );
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(3);
    });

    it('should handle count query error', async () => {
      mockSelect.mockReturnValueOnce({
        then: (resolve: (val: unknown) => void) =>
          resolve({ count: null, error: new Error('Count error') }),
      });

      const res = await request(app).get('/home');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Count error');
    });

    it('should handle recent query error', async () => {
      mockSelect.mockReturnValueOnce({
        then: (resolve: (val: unknown) => void) => resolve({ count: 12, error: null }),
      });
      mockLimit.mockResolvedValueOnce({ data: null, error: new Error('Recent error') });

      const res = await request(app).get('/home');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Recent error');
    });

    it('should handle recipes with missing author, prep_time, and categories', async () => {
      mockSelect.mockReturnValueOnce({
        then: (resolve: (val: unknown) => void) => resolve({ count: null, error: null }),
      });
      mockLimit.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            title: 'Empty Recipe',
            recipe_categories: [{ categories: { name: null } }],
          },
          {
            id: '2',
            title: 'Empty Recipe 2',
            recipe_categories: null,
          },
        ],
        error: null,
      });

      const res = await request(app).get('/home');

      expect(res.status).toBe(200);
      expect(res.body.totalRecipes).toBe(0);
      expect(res.body.recentRecipes[0].author).toBe('Delisha Marie');
      expect(res.body.recentRecipes[0].prepTime).toBe('');
      expect(res.body.recentRecipes[0].category).toBe('Uncategorized');
      expect(res.body.recentRecipes[1].category).toBe('Uncategorized');
    });
  });

  describe('GET /holidays', () => {
    it('should return holidays', async () => {
      const mockData = [
        { id: 1, name: 'Christmas' },
        { id: 2, name: 'Thanksgiving' },
      ];
      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const res = await request(app).get('/holidays');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('holidays');
    });

    it('should handle errors', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

      const res = await request(app).get('/holidays');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /special-diets', () => {
    it('should return special diets', async () => {
      const mockData = [
        { id: 1, name: 'Gluten-Free' },
        { id: 2, name: 'Vegan' },
      ];
      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const res = await request(app).get('/special-diets');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('special_diets');
    });

    it('should handle errors', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

      const res = await request(app).get('/special-diets');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /methods', () => {
    it('should return methods', async () => {
      const mockData = [
        { id: 1, name: 'Air Frying', slug: 'air-frying' },
        { id: 2, name: 'Baking', slug: 'baking' },
      ];
      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const res = await request(app).get('/methods');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('methods');
    });

    it('should handle errors', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

      const res = await request(app).get('/methods');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /categories', () => {
    it('should return categories starting with /recipes/', async () => {
      const mockData = [{ id: 1, name: 'Dinner', url: '/recipes/dinner' }];
      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const res = await request(app).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(mockSelect).toHaveBeenCalledWith('id, name, url');
      expect(mockIlike).toHaveBeenCalledWith('url', '/recipes/%');
    });

    it('should handle errors', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

      const res = await request(app).get('/categories');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /check-slug', () => {
    it('should return true if slug is taken', async () => {
      mockLimit.mockResolvedValue({ data: [{ id: 1 }], error: null });

      const res = await request(app).get('/check-slug?slug=taken-slug');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ taken: true });
      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('slug', 'taken-slug');
    });

    it('should return false if slug is available', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      const res = await request(app).get('/check-slug?slug=free-slug');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ taken: false });
    });

    it('should handle missing slug parameter', async () => {
      const res = await request(app).get('/check-slug');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing or invalid slug parameter');
    });

    it('should handle database errors', async () => {
      mockLimit.mockResolvedValue({ data: null, error: new Error('DB error') });

      const res = await request(app).get('/check-slug?slug=error-slug');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /recipes/:id', () => {
    it('should return a specific recipe', async () => {
      const mockRecipe = {
        id: '123',
        title: 'Test Recipe',
        status: 'published',
        recipe_holidays: [{ holidays: { name: 'Christmas' } }],
        recipe_special_diets: [{ special_diets: { name: 'Vegan' } }],
        recipe_categories: [
          { categories: { name: 'Baking', url: '/recipes/baking' } },
          { categories: { name: 'Cakes', url: '/recipes/baking/cakes' } },
          { categories: { name: 'Holiday', url: '/recipes/holiday' } },
          { categories: { name: 'The Best Baking', url: '/the-best-recipes/the-best-baking' } },
        ],
      };

      mockSingle.mockResolvedValue({ data: mockRecipe, error: null });

      const res = await request(app).get('/recipes/123').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: '123',
        title: 'Test Recipe',
        status: 'published',
        holidays: ['Christmas'],
        specialDiets: ['Vegan'],
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'The Best Recipes', url: '/the-best-recipes' },
              { name: 'The Best Baking', url: '/the-best-recipes/the-best-baking' },
            ],
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Baking', url: '/recipes/baking' },
              { name: 'Cakes', url: '/recipes/baking/cakes' },
            ],
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Holiday', url: '/recipes/holiday' },
            ],
          ],
        },
      });
    });

    it('should return null category if recipe_categories is malformed or empty', async () => {
      const mockRecipe = {
        id: '123',
        title: 'Test Recipe',
        recipe_categories: [
          null,
          { categories: null },
          { categories: { name: 'Baking' } }, // missing url
          { categories: { url: '/recipes/baking' } }, // missing name
        ],
      };

      mockSingle.mockResolvedValue({ data: mockRecipe, error: null });

      const res = await request(app).get('/recipes/123').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.category).toBeNull();
    });

    it('should return 404 if recipe not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const res = await request(app).get('/recipes/999').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Recipe not found');
    });

    it('should handle general errors gracefully', async () => {
      mockSingle.mockRejectedValue(new Error('Unexpected DB error'));

      const res = await request(app).get('/recipes/999').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Unexpected DB error');
    });

    it('should throw error if db returns non-PGRST116 error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: '500', message: 'Some db error' },
      });

      const res = await request(app).get('/recipes/999').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('[object Object]');
    });
  });

  describe('POST /recipes', () => {
    it('should successfully create a recipe and associate categories, method, holidays, and special diets', async () => {
      const inputRecipe = {
        title: 'New Salad',
        description: 'Fresh veggies',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
            ],
          ],
        },
        method: 'Baking',
        holidays: ['Christmas'],
        specialDiets: ['Vegan'],
      };
      const createdRecipe = {
        id: 'recipe-3',
        title: 'New Salad',
        description: 'Fresh veggies',
        nutrition: { calories_count: 100 },
      };

      // Mock recipes insert
      mockSingle.mockResolvedValueOnce({ data: createdRecipe, error: null });

      // Mock chain methods for finding/inserting relations
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'cat-1' }, error: null }); // Category find

      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // Method find
      mockSingle.mockResolvedValueOnce({ data: { id: 'method-1' }, error: null }); // Method insert

      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'hol-1' }, error: null }); // Holiday find

      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'diet-1' }, error: null }); // Diet find

      const res = await request(app).post('/recipes').send(inputRecipe);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Salad');
      expect(res.body.category).toEqual(inputRecipe.category);
      expect(res.body.nutrition).toEqual({ caloriesCount: 100 });
    });

    it('should return 400 when recipe creation fails', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('Invalid payload') });

      const res = await request(app).post('/recipes').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid payload');
    });
  });

  describe('PUT /recipes/:id', () => {
    it('should successfully update a recipe and re-associate categories, method, holidays, and special diets', async () => {
      const updateData = {
        title: 'Updated Salad',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
            ],
          ],
        },
        method: 'Baking',
        holidays: ['Christmas'],
        specialDiets: ['Vegan'],
      };
      const updatedRecipe = {
        id: 'recipe-3',
        title: 'Updated Salad',
        description: 'Fresh veggies',
      };

      // Mock recipe update check
      mockMaybeSingle.mockResolvedValueOnce({ data: updatedRecipe, error: null });

      // Mock category find category
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'cat-1' }, error: null });

      // Mock method find method & insert
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: { id: 'method-1' }, error: null });

      // Mock holiday find holiday
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'hol-1' }, error: null });

      // Mock special diet find diet
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'diet-1' }, error: null });

      const res = await request(app).put('/recipes/recipe-3').send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Salad');
    });

    it('should return 400 if update does not find the recipe', async () => {
      const updateData = { title: 'Missing Recipe' };
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // update query
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // select query

      const res = await request(app).put('/recipes/recipe-99').send(updateData);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Recipe not found');
    });

    it('should fall back to select when update returns null but recipe exists', async () => {
      const updateData = {
        title: 'Existing Recipe',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
            ],
          ],
        },
        method: 'Baking',
        holidays: ['Christmas'],
        specialDiets: ['Vegan'],
      };
      const existingRecipe = { id: 'recipe-3', title: 'Existing Recipe' };

      // Mock update query returning null
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // Mock select query returning existing recipe
      mockMaybeSingle.mockResolvedValueOnce({ data: existingRecipe, error: null });

      // Mock category find category
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'cat-1' }, error: null });

      // Mock method find method & insert
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: { id: 'method-1' }, error: null });

      // Mock holiday find holiday
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'hol-1' }, error: null });

      // Mock special diet find diet
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'diet-1' }, error: null });

      const res = await request(app).put('/recipes/recipe-3').send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Existing Recipe');
    });

    it('should return 400 when recipe update fails', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('Update failed') });

      const res = await request(app).put('/recipes/recipe-3').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Update failed');
    });
  });

  describe('DELETE /recipes/:id', () => {
    it('should successfully delete a recipe and return success', async () => {
      mockEq.mockResolvedValue({ error: null });

      const res = await request(app).delete('/recipes/recipe-3');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(backendService.getClient).toHaveBeenCalledWith('test-token-xyz');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'recipe-3');
    });

    it('should return 400 when recipe deletion fails', async () => {
      mockEq.mockResolvedValue({ error: new Error('Delete forbidden') });

      const res = await request(app).delete('/recipes/recipe-3');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Delete forbidden');
    });
  });

  describe('Non-Error Error Handling Catch-block Boosters', () => {
    it('should return 500 when GET /recipes receives a non-Error string exception', async () => {
      mockRange.mockRejectedValue('Raw GET string exception');
      const res = await request(app).get('/recipes');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Raw GET string exception');
    });

    it('should return 400 when POST /recipes receives a non-Error string exception', async () => {
      mockSingle.mockRejectedValue('Raw POST string exception');
      const res = await request(app).post('/recipes').send({ title: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Raw POST string exception');
    });

    it('should return 400 when PUT /recipes/:id receives a non-Error string exception', async () => {
      mockMaybeSingle.mockRejectedValue('Raw PUT string exception');
      const res = await request(app).put('/recipes/recipe-3').send({ title: 'Update' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Raw PUT string exception');
    });

    it('should return 400 when DELETE /recipes/:id receives a non-Error string exception', async () => {
      mockEq.mockRejectedValue('Raw DELETE string exception');
      const res = await request(app).delete('/recipes/recipe-3');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Raw DELETE string exception');
    });

    it('should return 500 when GET /home receives a non-Error string exception', async () => {
      mockSelect.mockRejectedValueOnce('Raw GET /home string exception');
      const res = await request(app).get('/home');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Raw GET /home string exception');
    });

    it.each([
      ['/holidays', 'Raw GET /holidays string exception'],
      ['/special-diets', 'Raw GET /special-diets string exception'],
      ['/methods', 'Raw GET /methods string exception'],
    ])(
      'should return 500 when GET %s receives a non-Error string exception',
      async (endpoint, errorMsg) => {
        mockOrder.mockRejectedValue(errorMsg);
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(500);
        expect(res.body.error).toBe(errorMsg);
      },
    );
  });

  describe('Recipes Router API Coverage Boosters', () => {
    it('should cover nullable field normalization and nutrition mapping', async () => {
      const inputRecipe = {
        title: 'New Salad',
        prepTime: '',
        cuisine: '',
        video: '',
        nutrition: {
          calories: '100 kcal',
          fatContent: '5g',
        },
      };
      const createdRecipe = { id: 'recipe-4', title: 'New Salad' };

      // Mock recipes insert
      mockSingle.mockResolvedValueOnce({ data: createdRecipe, error: null });

      const res = await request(app).post('/recipes').send(inputRecipe);

      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          prep_time: null,
          cuisine: null,
          video: null,
          nutrition: {
            calories: '100 kcal',
            fat_content: '5g',
          },
        }),
      );
    });

    it('should cover category trails skip patterns and category insertion', async () => {
      const inputRecipe = {
        title: 'New Salad',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: '', url: '/recipes/dinner' }, // empty name
              { name: 'Dinner', url: '' }, // empty url
              { name: 'Pizza', url: '/recipe/pizza' }, // starts with /recipe/
              { name: 'Salads', url: '/salads' }, // normal new category
            ],
          ],
        },
      };
      const createdRecipe = { id: 'recipe-5', title: 'New Salad' };

      // Mock recipes insert
      mockSingle.mockResolvedValueOnce({ data: createdRecipe, error: null });

      // Mock category lookup for "Dinner" (url: '')
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: { id: 'cat-dinner' }, error: null });

      // Mock category lookup for "Salads"
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // Mock category insert
      mockSingle.mockResolvedValueOnce({ data: { id: 'cat-new-99' }, error: null });

      const res = await request(app).post('/recipes').send(inputRecipe);

      expect(res.status).toBe(200);
      // Verify category table query
      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(mockInsert).toHaveBeenCalledWith({ name: 'Salads', url: '/salads' });
    });

    it('should cover existing cooking method skip-insert branch', async () => {
      const inputRecipe = {
        title: 'New Salad',
        method: 'Baking',
      };
      const createdRecipe = { id: 'recipe-6', title: 'New Salad' };

      mockSingle.mockResolvedValueOnce({ data: createdRecipe, error: null });

      // Mock method lookup - returns existing method
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'method-existing' }, error: null });

      const res = await request(app).post('/recipes').send(inputRecipe);

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('recipe_methods');
      expect(mockUpsert).toHaveBeenCalledWith(
        { recipe_id: 'recipe-6', method_id: 'method-existing' },
        { onConflict: 'recipe_id,method_id' },
      );
    });

    it('should cover holiday and diet skip patterns and insertions', async () => {
      const inputRecipe = {
        title: 'New Salad',
        holidays: ['', '  ', 'Christmas'],
        specialDiets: ['', '  ', 'Vegan'],
      };
      const createdRecipe = { id: 'recipe-7', title: 'New Salad' };

      mockSingle.mockResolvedValueOnce({ data: createdRecipe, error: null });

      // Holiday lookup - returns null (not existing)
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // Holiday insert
      mockSingle.mockResolvedValueOnce({ data: { id: 'hol-new' }, error: null });

      // Diet lookup - returns null (not existing)
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // Diet insert
      mockSingle.mockResolvedValueOnce({ data: { id: 'diet-new' }, error: null });

      const res = await request(app).post('/recipes').send(inputRecipe);

      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith({ name: 'Christmas', slug: 'christmas' });
      expect(mockInsert).toHaveBeenCalledWith({ name: 'Vegan', slug: 'vegan' });
    });

    it('should cover relation error handling branches (category lookup error)', async () => {
      const inputRecipe = {
        title: 'New Salad',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
            ],
          ],
        },
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      // Category lookup error
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Category DB lookup failed'),
      });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Category DB lookup failed');
    });

    it('should cover relation error handling branches (method lookup error)', async () => {
      const inputRecipe = {
        title: 'New Salad',
        method: 'Baking',
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      // Method lookup error
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Method DB lookup failed'),
      });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Method DB lookup failed');
    });

    it('should cover relation error handling branches (holiday lookup error)', async () => {
      const inputRecipe = {
        title: 'New Salad',
        holidays: ['Christmas'],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      // Holiday lookup error
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Holiday DB lookup failed'),
      });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Holiday DB lookup failed');
    });

    it('should cover relation error handling branches (special diet lookup error)', async () => {
      const inputRecipe = {
        title: 'New Salad',
        specialDiets: ['Vegan'],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      // Diet lookup error
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Diet DB lookup failed'),
      });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Diet DB lookup failed');
    });

    it('should cover category insert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
            ],
          ],
        },
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Category insert failed') });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Category insert failed');
    });

    it('should cover category relation upsert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
            ],
          ],
        },
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'cat-1' }, error: null });
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: new Error('Category rel upsert failed'),
      });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Category rel upsert failed');
    });

    it('should cover method insert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        method: 'Baking',
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Method insert failed') });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Method insert failed');
    });

    it('should cover method relation upsert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        method: 'Baking',
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'method-1' }, error: null });
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: new Error('Method rel upsert failed'),
      });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Method rel upsert failed');
    });

    it('should cover holiday insert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        holidays: ['Christmas'],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Holiday insert failed') });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Holiday insert failed');
    });

    it('should cover holiday relation upsert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        holidays: ['Christmas'],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'hol-1' }, error: null });
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: new Error('Holiday rel upsert failed'),
      });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Holiday rel upsert failed');
    });

    it('should cover special diet insert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        specialDiets: ['Vegan'],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Diet insert failed') });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Diet insert failed');
    });

    it('should cover special diet relation upsert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        specialDiets: ['Vegan'],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-error' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'diet-1' }, error: null });
      mockUpsert.mockResolvedValueOnce({ data: null, error: new Error('Diet rel upsert failed') });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Diet rel upsert failed');
    });

    it('should cover saveAllRecipeRelations delete error', async () => {
      const inputRecipe = { title: 'New Salad', method: 'Baking' };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-8' }, error: null }); // insert success
      // Mock delete to throw error
      mockEq.mockResolvedValueOnce({ data: null, error: new Error('Delete relation error') });

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Delete relation error');
    });

    it('should cover non-array trails in saveRecipeCategoryTrail', async () => {
      const inputRecipe = {
        title: 'New Salad',
        category: {
          trails: [
            'not-an-array', // Hits the !Array.isArray(trail) branch
          ],
        },
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-9' }, error: null });
      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(200);
    });

    it('should cover empty string url in trails', async () => {
      const inputRecipe = {
        title: 'New Salad',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '' }, // Hits the empty string urlOverride fallback branch if we modify recipes.ts slightly
            ],
          ],
        },
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-10' }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // lookup Dinner
      mockSingle.mockResolvedValueOnce({ data: { id: 'cat-dinner' }, error: null }); // insert Dinner
      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(200);
    });

    it('should cover empty string or non-string in saveRecipeListRelations', async () => {
      const inputRecipe = {
        title: 'New Salad',
        holidays: [123, '  '], // Hits the false branch of typeof name === 'string' && name.trim() !== ''
        specialDiets: [null, undefined],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-11' }, error: null });
      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(200);
    });

    it('should cover valid nullable string fields in normalizeDbBody', async () => {
      const inputRecipe = {
        title: 'New Salad',
        prep_time: '10 mins', // Hits false branch of result[key] === ''
        cuisine: 'Italian',
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-12' }, error: null });
      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          prep_time: '10 mins',
          cuisine: 'Italian',
        }),
      );
    });

    it('should cover equipment array processing and insert', async () => {
      const inputRecipe = {
        title: 'New Salad',
        equipment: [
          { title: 'Pan', url: 'http://pan.com', image: 'pan.jpg' },
          { title: 'Knife', url: 'http://knife.com', image: 'knife.jpg' },
        ],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-13' }, error: null });
      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('equipment');
      expect(mockInsert).toHaveBeenCalledWith([
        { recipe_id: 'recipe-13', title: 'Pan', url: 'http://pan.com', image: 'pan.jpg' },
        { recipe_id: 'recipe-13', title: 'Knife', url: 'http://knife.com', image: 'knife.jpg' },
      ]);
    });

    it('should cover equipment insert error', async () => {
      const inputRecipe = {
        title: 'New Salad',
        equipment: [{ title: 'Pan' }],
      };
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-14' }, error: null });
      vi.mocked(mockChain.then).mockImplementationOnce((resolve: any) =>
        resolve({ data: null, error: new Error('Equipment insert failed') }),
      );

      const res = await request(app).post('/recipes').send(inputRecipe);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Equipment insert failed');
    });
  });
});
