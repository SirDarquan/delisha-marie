import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      functions: {
        invoke: mockInvoke,
      },
    })),
  };
});

import express from 'express';
import request from 'supertest';
import searchRouter from './search';
import { resetSupabaseClient } from './supabase';

vi.spyOn(console, 'error').mockImplementation(vi.fn());

const app = express();
app.use(express.json());
app.use('/api', searchRouter);

describe('Search Router API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
  });

  describe('POST /api/search', () => {
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
  });
});
