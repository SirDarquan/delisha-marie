import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pagesRouter } from './pages';
import cookieParser from 'cookie-parser';
import { backendService } from './supabase-backend.service';

vi.spyOn(backendService, 'getClient');
vi.spyOn(backendService, 'verifyToken');

describe('Admin Pages Router API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(backendService.verifyToken).mockResolvedValue({
      id: 'test-user-id',
    } as unknown as import('@supabase/supabase-js').User);
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use((req, _res, next) => {
      req.cookies = { admin_access_token: 'test-token-xyz' };
      next();
    });
    app.use('/api', pagesRouter);
  });

  describe('GET /api/pages', () => {
    it('should list all pages', async () => {
      const mockEq = vi
        .fn()
        .mockResolvedValue({ data: [{ id: 1, slug: 'about', title: 'About' }], error: null });
      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
        then: (cb: (res: unknown) => void) =>
          cb({ data: [{ id: 1, slug: 'about', title: 'About' }], error: null }),
      });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/pages');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, slug: 'about', title: 'About' }]);
    });

    it('should throw error when getting pages fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
        then: (cb: (res: unknown) => void) => cb({ data: null, error: new Error('DB Error') }),
      });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/pages');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/pages/:slug', () => {
    it('should return a page by slug', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 1, slug: 'about', title: 'About', content: '<p>HTML</p>' },
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/pages/about');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, slug: 'about', title: 'About', content: '<p>HTML</p>' });
    });

    it('should throw an error for generic DB error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/pages/about');
      expect(res.status).toBe(500);
    });

    it('should return 404 if page not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/pages/about');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Page not found' });
    });
  });

  describe('PUT /api/pages/:slug', () => {
    it('should return 400 if title is missing', async () => {
      const res = await request(app).put('/api/pages/about').send({ content: '<p>Hi</p>' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Title is required' });
    });

    it('should insert a new page if it does not exist', async () => {
      const mockSingleInsert = vi
        .fn()
        .mockResolvedValue({ data: { id: 1, slug: 'about', title: 'About' }, error: null });
      const mockSelectInsert = vi.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelectInsert });

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEqFind = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'pages') {
          return {
            select: mockSelectFind,
            insert: mockInsert,
          };
        }
        return {};
      });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app)
        .put('/api/pages/about')
        .send({ title: 'About', content: '<p>Hi</p>' });

      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalled();
      expect(res.body).toEqual({ id: 1, slug: 'about', title: 'About' });
    });

    it('should update an existing page if it exists', async () => {
      const mockSingleUpdate = vi
        .fn()
        .mockResolvedValue({ data: { id: 1, slug: 'about', title: 'About' }, error: null });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
      const mockEqFind = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'pages') {
          return {
            select: mockSelectFind,
            update: mockUpdate,
          };
        }
        return {};
      });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app)
        .put('/api/pages/about')
        .send({ title: 'About', content: '<p>Hi</p>' });

      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
      expect(res.body).toEqual({ id: 1, slug: 'about', title: 'About' });
    });

    it('should throw an error when finding an existing page fails', async () => {
      const mockMaybeSingle = vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error('DB Error') });
      const mockEqFind = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: () => ({ select: mockSelectFind }),
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).put('/api/pages/about').send({ title: 'About' });
      expect(res.status).toBe(500);
    });

    it('should throw an error when updating an existing page fails', async () => {
      const mockSingleUpdate = vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error('Update Error') });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
      const mockEqFind = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: () => ({ select: mockSelectFind, update: mockUpdate }),
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).put('/api/pages/about').send({ title: 'About' });
      expect(res.status).toBe(500);
    });

    it('should throw an error when inserting a new page fails', async () => {
      const mockSingleInsert = vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error('Insert Error') });
      const mockSelectInsert = vi.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelectInsert });

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEqFind = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: () => ({ select: mockSelectFind, insert: mockInsert }),
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).put('/api/pages/about').send({ title: 'About' });
      expect(res.status).toBe(500);
    });
  });
});
