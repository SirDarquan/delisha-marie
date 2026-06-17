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
}));

// 2. Setup the chain linkages
const mockChain: any = {
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
  then: (resolve: any) => resolve({ data: null, error: null }),
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
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ data: null, error: null });

    vi.mocked(backendService.getClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Mock verifyToken to immediately succeed and inject user context
    vi.mocked(backendService.verifyToken).mockResolvedValue({
      username: 'test-user',
      email: 'test@example.com',
    } as any);

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
      expect(res.body).toEqual(mockList);
      expect(backendService.getClient).toHaveBeenCalledWith('test-token-xyz');
      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return 500 when fetching recipes throws an error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('Database error') });

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
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

    it('should fallback to inserting a recipe if update does not find one', async () => {
      const updateData = { title: 'Missing Recipe' };
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: { id: 'recipe-99', title: 'Missing Recipe' }, error: null });

      const res = await request(app).put('/recipes/recipe-99').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Missing Recipe');
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
  });
});
