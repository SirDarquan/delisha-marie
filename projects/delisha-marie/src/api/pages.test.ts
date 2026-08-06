import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pagesRouter } from './pages';
import { resetSupabaseClient } from './supabase';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn().mockReturnValue({
      from: mockFrom,
    }),
  };
});

describe('Public Pages Router API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
    app = express();
    app.use(express.json());
    app.use('/api/pages', pagesRouter);
  });

  describe('GET /api/pages/:slug', () => {
    it('should return a page by slug', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { title: 'About', content: '<p>HTML</p>', updated_at: '2026-08-01' },
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await request(app).get('/api/pages/about');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        title: 'About',
        content: '<p>HTML</p>',
        updated_at: '2026-08-01',
      });
    });

    it('should return 404 if page not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await request(app).get('/api/pages/about');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Page not found' });
    });

    it('should return 500 if other DB error occurs', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: null, error: { code: 'UNKNOWN_ERR', message: 'DB Failed' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await request(app).get('/api/pages/about');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch page' });
    });

    it('should return 500 if non-Error is thrown', async () => {
      const mockSingle = vi.fn().mockRejectedValue('String error');
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await request(app).get('/api/pages/about');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch page' });
    });
  });
});
