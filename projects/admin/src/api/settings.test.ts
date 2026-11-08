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
      const mockIs = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/settings/kitchen-home');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
      expect(mockEq).toHaveBeenCalledWith('key', 'kitchen_home');
      expect(mockIs).toHaveBeenCalledWith('tenant_id', null);
    });

    it('should return parsed settings from site_settings when row exists', async () => {
      const stored = {
        featuredRecipes: ['/recipes/soup', '/recipes/salad', ''],
        kitchen_about: 'custom_kitchen.webp',
        sidebar_about: 'custom_sidebar.webp',
      };
      const mockIs = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { value: JSON.stringify(stored) },
          error: null,
        }),
      });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/settings/kitchen-home');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stored);
    });

    it('should scope by tenantId when member user has tenant', async () => {
      // Mock member with tenant
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
              data: { id: 'tenant-999', name: 'Member Kitchen', slug: 'member-kitchen' },
              error: null,
            }),
        }),
      } as unknown as typeof backendService.supabaseAdmin;

      const mockEqTenant = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            value: {
              featuredRecipes: ['/recipes/member'],
              kitchen_about: 'member.png',
              sidebar_about: 'member_side.png',
            },
          },
          error: null,
        }),
      });
      const mockEqKey = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqKey });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: mockFrom,
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).get('/api/settings/kitchen-home');

      expect(res.status).toBe(200);
      expect(mockEqKey).toHaveBeenCalledWith('key', 'kitchen_home');
      expect(mockEqTenant).toHaveBeenCalledWith('tenant_id', 'tenant-999');
    });

    it('should return 500 when database error occurs', async () => {
      const mockIs = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Crash') }),
      });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
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
    it('should insert new record when existing setting does not exist', async () => {
      const mockIsFind = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockEqFind = vi.fn().mockReturnValue({ is: mockIsFind });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('site_settings');
        return {
          select: mockSelectFind,
          insert: mockInsert,
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
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'kitchen_home',
          value: JSON.stringify(payload),
          tenant_id: null,
        }),
      );
    });

    it('should update existing record when setting already exists for tenant', async () => {
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

      const mockEqTenantFind = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'row-123' }, error: null }),
      });
      const mockEqKeyFind = vi.fn().mockReturnValue({ eq: mockEqTenantFind });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqKeyFind });

      const mockEqUpdateTenant = vi.fn().mockResolvedValue({ error: null });
      const mockEqUpdateId = vi.fn().mockReturnValue({ eq: mockEqUpdateTenant });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdateId });

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('site_settings');
        return {
          select: mockSelectFind,
          update: mockUpdate,
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
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          value: JSON.stringify({
            featuredRecipes: ['/recipes/abc'],
            kitchen_about: 'abc.png',
            sidebar_about: 'abc_side.png',
          }),
        }),
      );
      expect(mockEqUpdateId).toHaveBeenCalledWith('id', 'row-123');
      expect(mockEqUpdateTenant).toHaveBeenCalledWith('tenant_id', 'tenant-abc');
    });

    it('should use default values if payload fields are omitted', async () => {
      const mockIsFind = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockEqFind = vi.fn().mockReturnValue({ is: mockIsFind });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: mockSelectFind,
          insert: mockInsert,
        }),
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).put('/api/settings/kitchen-home').send({});

      expect(res.status).toBe(200);
      expect(res.body.settings).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
    });

    it('should return 500 when find query fails', async () => {
      const mockIsFind = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('Find failed') }),
      });
      const mockEqFind = vi.fn().mockReturnValue({ is: mockIsFind });
      const mockSelectFind = vi.fn().mockReturnValue({ eq: mockEqFind });

      vi.mocked(backendService.getClient).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: mockSelectFind }),
      } as unknown as import('@supabase/supabase-js').SupabaseClient);

      const res = await request(app).put('/api/settings/kitchen-home').send({});

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to save settings' });
    });
  });
});
