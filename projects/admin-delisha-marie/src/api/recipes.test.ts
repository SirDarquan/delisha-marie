import { vi, describe, it, expect, beforeEach } from 'vitest';

// Ensure Env vars exist before static initialization in imported modules
vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

// 1. Explicitly declare mock functions outside to track calls
const { mockFrom, mockSelect, mockOrder, mockInsert, mockUpdate, mockDelete, mockEq, mockSingle } =
  vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockSelect: vi.fn(),
    mockOrder: vi.fn(),
    mockInsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockDelete: vi.fn(),
    mockEq: vi.fn(),
    mockSingle: vi.fn(),
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
};

import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
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
    mockSingle.mockReturnValue(mockChain);

    vi.mocked(backendService.getClient).mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof backendService.getClient>);

    vi.mocked(backendService.verifyToken).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    } as unknown as Awaited<ReturnType<typeof backendService.verifyToken>>);

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Automatically inject access cookie into every request to pass authMiddleware
    app.use((req, res, next) => {
      req.cookies = req.cookies || {};
      req.cookies['admin_access_token'] = 'test-token-xyz';
      next();
    });

    app.use('/', recipesRouter);
  });

  describe('GET /recipes', () => {
    it('should successfully fetch recipes and return them', async () => {
      const mockRecipes = [
        { id: 'recipe-1', title: 'Delicious Cake' },
        { id: 'recipe-2', title: 'Yummy Pie' },
      ];

      mockOrder.mockResolvedValue({ data: mockRecipes, error: null });

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRecipes);
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
    it('should successfully create a recipe and return the result', async () => {
      const inputRecipe = { title: 'New Salad', description: 'Fresh veggies' };
      const createdRecipe = { id: 'recipe-3', ...inputRecipe };

      mockSingle.mockResolvedValue({ data: createdRecipe, error: null });

      const res = await request(app).post('/recipes').send(inputRecipe);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(createdRecipe);
      expect(backendService.getClient).toHaveBeenCalledWith('test-token-xyz');
      expect(mockInsert).toHaveBeenCalledWith(inputRecipe);
    });

    it('should return 400 when recipe creation fails', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('Invalid payload') });

      const res = await request(app).post('/recipes').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid payload');
    });
  });

  describe('PUT /recipes/:id', () => {
    it('should successfully update a recipe and return the result', async () => {
      const updateData = { title: 'Updated Salad' };
      const updatedRecipe = {
        id: 'recipe-3',
        title: 'Updated Salad',
        description: 'Fresh veggies',
      };

      mockSingle.mockResolvedValue({ data: updatedRecipe, error: null });

      const res = await request(app).put('/recipes/recipe-3').send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedRecipe);
      expect(backendService.getClient).toHaveBeenCalledWith('test-token-xyz');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', 'recipe-3');
    });

    it('should return 400 when recipe update fails', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('Update failed') });

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
});
