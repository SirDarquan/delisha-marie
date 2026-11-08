import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import settingsRouter, { DEFAULT_KITCHEN_HOME_SETTINGS } from './settings';
import cookieParser from 'cookie-parser';
import { backendService } from './supabase-backend.service';

vi.spyOn(backendService, 'getClient');
vi.spyOn(backendService, 'verifyToken');

describe('Admin Settings Router API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(backendService.verifyToken).mockResolvedValue({
      id: 'test-user-id',
    } as unknown as import('@supabase/supabase-js').User);
    backendService.supabaseAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'admin', status: 'active' },
          error: null,
        }),
      }),
    } as unknown as typeof backendService.supabaseAdmin;
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use((req, _res, next) => {
      req.cookies = { admin_access_token: 'test-token-xyz' };
      next();
    });
    app.use('/api', settingsRouter);
  });

  describe('GET /api/settings/kitchen-home', () => {
    it('should return default settings when no row exists in site_settings', async () => {
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/settings/kitchen-home');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
      expect(mockEq).toHaveBeenCalledWith('key', 'kitchen_home');
    });

    it('should return parsed settings from site_settings when row exists (stringified JSON)', async () => {
      const stored = {
        featuredRecipes: ['/recipes/soup', '/recipes/salad', ''],
        kitchen_about: 'custom_kitchen.webp',
        sidebar_about: 'custom_sidebar.webp',
      };
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { value: JSON.stringify(stored) },
          error: null,
        }),
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/settings/kitchen-home');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stored);
    });

    it('should return parsed settings from site_settings when value is already an object', async () => {
      const stored = {
        featuredRecipes: ['/recipes/member'],
        kitchen_about: 'member.png',
        sidebar_about: 'member_side.png',
      };
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { value: stored },
          error: null,
        }),
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/settings/kitchen-home');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ...DEFAULT_KITCHEN_HOME_SETTINGS,
        ...stored,
      });
    });

    it('should return 500 when database error occurs', async () => {
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Crash') }),
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/settings/kitchen-home');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to get settings' });
    });
  });

  describe('PUT /api/settings/kitchen-home', () => {
    it('should upsert record to site_settings with default tenant null when user has no tenant', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('site_settings');
        return {
          upsert: mockUpsert,
        };
      });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const payload = {
        featuredRecipes: ['/recipes/1', '/recipes/2', '/recipes/3'],
        kitchen_about: 'new_kitchen.png',
        sidebar_about: 'new_sidebar.png',
      };

      const res = await request(app).put('/api/settings/kitchen-home').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings).toEqual(payload);
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          key: 'kitchen_home',
          value: JSON.stringify(payload),
        },
        { onConflict: 'key' },
      );
    });

    it('should attach tenant_id inside JSON value when member user has tenant', async () => {
      backendService.supabaseAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi
            .fn()
            .mockResolvedValueOnce({
              data: { role: 'member', status: 'active' },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 'tenant-abc', name: 'ABC Kitchen', slug: 'abc-kitchen' },
              error: null,
            }),
        }),
      } as unknown as typeof backendService.supabaseAdmin;

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('site_settings');
        return {
          upsert: mockUpsert,
        };
      });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const payload = {
        featuredRecipes: ['/recipes/abc'],
        kitchen_about: 'abc.png',
        sidebar_about: 'abc_side.png',
      };

      const res = await request(app).put('/api/settings/kitchen-home').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          key: 'kitchen_home',
          value: JSON.stringify({
            featuredRecipes: ['/recipes/abc'],
            kitchen_about: 'abc.png',
            sidebar_about: 'abc_side.png',
            tenant_id: 'tenant-abc',
          }),
        },
        { onConflict: 'key' },
      );
    });

    it('should use default values if payload fields are omitted', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          upsert: mockUpsert,
        }),
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).put('/api/settings/kitchen-home').send({});

      expect(res.status).toBe(200);
      expect(res.body.settings).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
    });

    it('should return 500 when upsert query fails', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: new Error('Upsert failed') });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).put('/api/settings/kitchen-home').send({});

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to save settings' });
    });
  });
});
