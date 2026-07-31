import { SupabaseClient, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

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

const mockChain = {
  from: mockFrom,
  select: mockSelect,
  order: mockOrder,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  single: mockSingle,
  then: (resolve: (val: { data: null; error: null }) => void) =>
    resolve({ data: null, error: null }),
};

import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import commentsRouter from './comments';
import { backendService } from './supabase-backend.service';

vi.spyOn(backendService, 'getClient');
vi.spyOn(backendService, 'verifyToken');

describe('Comments Router API', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.resetAllMocks();

    mockFrom.mockReturnValue(mockChain);
    mockSelect.mockReturnValue(mockChain);
    mockOrder.mockReturnValue(mockChain);
    mockInsert.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
    mockDelete.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockChain.then = <T>(resolve: (val: T) => void) =>
      resolve({ data: null, error: null } as unknown as T);

    vi.mocked(backendService.getClient).mockReturnValue({
      from: mockFrom,
    } as unknown as SupabaseClient);

    vi.spyOn(backendService, 'supabaseAdmin', 'get').mockReturnValue({
      from: mockFrom,
    } as unknown as SupabaseClient);

    vi.mocked(backendService.verifyToken).mockResolvedValue({
      username: 'test-user',
      email: 'test@example.com',
    } as unknown as User);

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    app.use((req, _res, next) => {
      req.cookies = { admin_access_token: 'test-token-xyz' };
      next();
    });

    app.use('/api', commentsRouter);
  });

  describe('GET /api/recipes/:recipeId/comments', () => {
    it('should successfully return comments for a recipe', async () => {
      const mockComments = [{ id: 'c-1', content: 'Test' }];
      mockSelect.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValueOnce(mockChain);
      mockOrder.mockResolvedValueOnce({ data: mockComments, error: null });

      const res = await request(app).get('/api/recipes/r-1/comments');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ comments: mockComments });
      expect(mockFrom).toHaveBeenCalledWith('comments');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('recipe_id', 'r-1');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should return 400 on error', async () => {
      mockSelect.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValueOnce(mockChain);
      mockOrder.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

      const res = await request(app).get('/api/recipes/r-1/comments');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DB error');

      mockSelect.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValueOnce(mockChain);
      mockOrder.mockRejectedValueOnce('String exception');

      const res2 = await request(app).get('/api/recipes/r-1/comments');
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('String exception');
    });
  });

  describe('POST /api/recipes/:recipeId/comments/:id/reply', () => {
    it('should successfully create a reply', async () => {
      const mockReply = { id: 'r-2', content: 'My reply' };
      mockInsert.mockReturnValueOnce(mockChain);
      mockSelect.mockReturnValueOnce(mockChain);
      mockSingle.mockResolvedValueOnce({ data: mockReply, error: null });

      const res = await request(app)
        .post('/api/recipes/r-1/comments/c-1/reply')
        .send({ content: 'My reply' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockReply);
      expect(mockInsert).toHaveBeenCalledWith([
        {
          recipe_id: 'r-1',
          parent_id: 'c-1',
          author: 'Delisha Marie',
          email: 'admin@delishamarie.com',
          content: 'My reply',
          is_admin: true,
          status: 'approved',
        },
      ]);
    });

    it('should return 400 if content is missing', async () => {
      const res = await request(app).post('/api/recipes/r-1/comments/c-1/reply').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content is required');
    });

    it('should return 400 on db error and handle non-Error string exceptions', async () => {
      mockInsert.mockReturnValueOnce(mockChain);
      mockSelect.mockReturnValueOnce(mockChain);
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

      const res = await request(app)
        .post('/api/recipes/r-1/comments/c-1/reply')
        .send({ content: 'My reply' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DB error');

      mockInsert.mockReturnValueOnce(mockChain);
      mockSelect.mockReturnValueOnce(mockChain);
      mockSingle.mockRejectedValueOnce('String exception');
      const res2 = await request(app)
        .post('/api/recipes/r-1/comments/c-1/reply')
        .send({ content: 'My reply' });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('String exception');
    });
  });

  describe('DELETE /api/recipes/:recipeId/comments/:id', () => {
    it('should successfully delete a comment', async () => {
      mockDelete.mockReturnValueOnce(mockChain);
      mockEq.mockResolvedValueOnce({ error: null });

      const res = await request(app).delete('/api/recipes/r-1/comments/c-1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'c-1');
    });

    it('should return 400 on error', async () => {
      mockDelete.mockReturnValueOnce(mockChain);
      mockEq.mockResolvedValueOnce({ error: new Error('Delete failed') });

      const res = await request(app).delete('/api/recipes/r-1/comments/c-1');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Delete failed');

      mockDelete.mockReturnValueOnce(mockChain);
      mockEq.mockRejectedValueOnce('String delete exception');

      const res2 = await request(app).delete('/api/recipes/r-1/comments/c-1');
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('String delete exception');
    });
  });

  describe('PATCH /api/recipes/:recipeId/comments/:id/skip', () => {
    it('should update status to skipped when skipped is true', async () => {
      const mockUpdated = { id: 'c-1', status: 'skipped' };
      mockUpdate.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValueOnce(mockChain);
      mockSelect.mockReturnValueOnce(mockChain);
      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const res = await request(app)
        .patch('/api/recipes/r-1/comments/c-1/skip')
        .send({ skipped: true });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdated);
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'skipped' });
    });

    it('should update status to approved when skipped is false', async () => {
      const mockUpdated = { id: 'c-1', status: 'approved' };
      mockUpdate.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValueOnce(mockChain);
      mockSelect.mockReturnValueOnce(mockChain);
      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const res = await request(app)
        .patch('/api/recipes/r-1/comments/c-1/skip')
        .send({ skipped: false });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdated);
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'approved' });
    });

    it('should return 400 on error', async () => {
      mockUpdate.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValueOnce(mockChain);
      mockSelect.mockReturnValueOnce(mockChain);
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Skip failed') });

      const res = await request(app)
        .patch('/api/recipes/r-1/comments/c-1/skip')
        .send({ skipped: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Skip failed');

      mockUpdate.mockReturnValueOnce(mockChain);
      mockEq.mockReturnValueOnce(mockChain);
      mockSelect.mockReturnValueOnce(mockChain);
      mockSingle.mockRejectedValueOnce('String skip exception');

      const res2 = await request(app)
        .patch('/api/recipes/r-1/comments/c-1/skip')
        .send({ skipped: true });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('String skip exception');
    });
  });
});
