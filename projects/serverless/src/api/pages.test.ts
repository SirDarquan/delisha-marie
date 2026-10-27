import { createRequestMock } from './test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import pagesRouter from './pages';
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
  let request: ReturnType<typeof createRequestMock>;
  const app = null;

  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
    request = createRequestMock(pagesRouter);
  });

  describe('GET /api/pages/:slug', () => {
    it('should return a page by slug', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { title: 'About', content: '<p>HTML</p>', updated_at: '2026-08-01' },
        error: null,
      });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
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

    it('should fall back to legacy slug when kitchen:slug is not found', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // kitchen:about not found
        .mockResolvedValueOnce({
          data: { title: 'Legacy About', content: '<p>Legacy HTML</p>', updated_at: '2026-08-01' },
          error: null,
        }); // about found
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await request(app).get('/api/pages/kitchen:about');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        title: 'Legacy About',
        content: '<p>Legacy HTML</p>',
        updated_at: '2026-08-01',
      });
      expect(mockEq).toHaveBeenCalledWith('slug', 'kitchen:about');
      expect(mockEq).toHaveBeenCalledWith('slug', 'about');
    });

    it('should return 404 if page not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
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
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await request(app).get('/api/pages/about');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch page' });
    });

    it('should return 404 for missing slug', async () => {
      const res = await request(app).get('/api/pages');
      // our test-utils automatically makes req.query['slug'] undefined if we query /api/pages
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not found' });
    });

    it('should return 404 for non-GET methods', async () => {
      const res = await request(app).post('/api/pages/about').send();
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not found' });
    });
  });
});
