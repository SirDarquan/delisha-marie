import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import recipesRouter from './recipes';
import { backendService } from './supabase-backend.service';

// Mock backendService
vi.mock('./supabase-backend.service', () => {
  return {
    backendService: {
      getRecipes: vi.fn(),
      createRecipe: vi.fn(),
      updateRecipe: vi.fn(),
      deleteRecipe: vi.fn(),
      verifyToken: vi.fn(),
    },
  };
});

// Mock authMiddleware to automatically authenticate and pass a test token/user
vi.mock('./middleware/auth.middleware', () => {
  return {
    authMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => {
      Object.assign(req, {
        user: { id: 'user-123', email: 'test@example.com' },
        token: 'test-token-xyz',
      });
      next();
    },
  };
});

describe('Recipes Router API', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/', recipesRouter);
  });

  describe('GET /recipes', () => {
    it('should successfully fetch recipes and return them', async () => {
      const mockRecipes = [
        { id: 'recipe-1', title: 'Delicious Cake' },
        { id: 'recipe-2', title: 'Yummy Pie' },
      ];

      vi.mocked(backendService.getRecipes).mockResolvedValue(mockRecipes);

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRecipes);
      expect(backendService.getRecipes).toHaveBeenCalledWith('test-token-xyz');
    });

    it('should return 500 when fetching recipes throws an error', async () => {
      vi.mocked(backendService.getRecipes).mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/recipes');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
    });
  });

  describe('POST /recipes', () => {
    it('should successfully create a recipe and return the result', async () => {
      const inputRecipe = { title: 'New Salad', description: 'Fresh veggies' };
      const createdRecipe = { id: 'recipe-3', ...inputRecipe };

      vi.mocked(backendService.createRecipe).mockResolvedValue(createdRecipe);

      const res = await request(app).post('/recipes').send(inputRecipe);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(createdRecipe);
      expect(backendService.createRecipe).toHaveBeenCalledWith(inputRecipe, 'test-token-xyz');
    });

    it('should return 400 when recipe creation fails', async () => {
      vi.mocked(backendService.createRecipe).mockRejectedValue(new Error('Invalid payload'));

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

      vi.mocked(backendService.updateRecipe).mockResolvedValue(updatedRecipe);

      const res = await request(app).put('/recipes/recipe-3').send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedRecipe);
      expect(backendService.updateRecipe).toHaveBeenCalledWith(
        'recipe-3',
        updateData,
        'test-token-xyz',
      );
    });

    it('should return 400 when recipe update fails', async () => {
      vi.mocked(backendService.updateRecipe).mockRejectedValue(new Error('Update failed'));

      const res = await request(app).put('/recipes/recipe-3').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Update failed');
    });
  });

  describe('DELETE /recipes/:id', () => {
    it('should successfully delete a recipe and return success', async () => {
      vi.mocked(backendService.deleteRecipe).mockResolvedValue();

      const res = await request(app).delete('/recipes/recipe-3');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(backendService.deleteRecipe).toHaveBeenCalledWith('recipe-3', 'test-token-xyz');
    });

    it('should return 400 when recipe deletion fails', async () => {
      vi.mocked(backendService.deleteRecipe).mockRejectedValue(new Error('Delete forbidden'));

      const res = await request(app).delete('/recipes/recipe-3');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Delete forbidden');
    });
  });
});
