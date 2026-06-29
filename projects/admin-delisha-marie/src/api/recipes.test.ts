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
    vi.clearAllMocks();

    // Reset default chain return values before each test run
    mockFrom.mockReturnValue(mockChain);
    mockSelect.mockReturnValue(mockChain);
    mockOrder.mockReturnValue(mockChain);
    mockInsert.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
    mockDelete.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockLimit.mockReturnValue(mockChain);
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ data: null, error: null });

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
      const mockList = [{ id: 'recipe-1', title: 'Salad' }];
      mockOrder.mockResolvedValue({ data: mockList, error: null });

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { id: 'recipe-1', title: 'Salad', holidays: [], specialDiets: [] },
      ]);
      expect(backendService.getClient).toHaveBeenCalledWith('test-token-xyz');
      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockSelect).toHaveBeenCalledWith(`
        *,
        recipe_holidays (
          holidays (name)
        ),
        recipe_special_diets (
          special_diets (name)
        )
      `);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return 500 when fetching recipes throws an error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('Database error') });

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
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
      const createdRecipe = { id: 'recipe-3', title: 'New Salad', description: 'Fresh veggies' };

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
      mockOrder.mockRejectedValue('Raw GET string exception');
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

    it('should return 500 when GET /holidays receives a non-Error string exception', async () => {
      mockOrder.mockRejectedValue('Raw GET /holidays string exception');
      const res = await request(app).get('/holidays');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Raw GET /holidays string exception');
    });

    it('should return 500 when GET /special-diets receives a non-Error string exception', async () => {
      mockOrder.mockRejectedValue('Raw GET /special-diets string exception');
      const res = await request(app).get('/special-diets');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Raw GET /special-diets string exception');
    });

    it('should return 500 when GET /methods receives a non-Error string exception', async () => {
      mockOrder.mockRejectedValue('Raw GET /methods string exception');
      const res = await request(app).get('/methods');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Raw GET /methods string exception');
    });
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
  });
});
