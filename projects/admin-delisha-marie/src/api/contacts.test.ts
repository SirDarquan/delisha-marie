import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import contactsRouter from './contacts';
import { backendService } from './supabase-backend.service';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.spyOn(backendService, 'verifyToken');

describe('Contacts API Router', () => {
  let app: express.Application;

  const createAuthFromMock = (
    contactsHandler: unknown,
    role = 'member',
    tenantId = 'tenant-123',
  ) => {
    return vi.fn().mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role, status: 'active' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'tenants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data:
                  role === 'member'
                    ? { id: tenantId, name: 'DM Tenant', slug: 'sirdarquan-dm' }
                    : null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'contacts') {
        return contactsHandler;
      }
      return {};
    });
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(backendService.verifyToken).mockResolvedValue({
      id: 'test-user-id',
      email: 'sirdarquan+dm@gmail.com',
    } as unknown as import('@supabase/supabase-js').User);

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use((req, _res, next) => {
      req.cookies = { admin_access_token: 'test-token' };
      next();
    });
    app.use('/api', contactsRouter);
  });

  describe('GET /api/contacts', () => {
    it('should return contacts from inbox by default', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [{ id: 1 }], count: 1, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockIsArchived = vi.fn().mockReturnValue({ or: mockOr });
      const mockIsDeleted = vi.fn().mockReturnValue({ is: mockIsArchived });
      const mockEq = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts?page=2&pageSize=10');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [{ id: 1 }], count: 1 });
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockEq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(10, 19);
    });

    it('should return empty list when user has no tenant', async () => {
      backendService.supabaseAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { role: 'admin', status: 'active' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [], count: 0 });
    });

    it('should query trash folder', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockNot = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ not: mockNot });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      await request(app).get('/api/contacts?folder=trash');
      expect(mockNot).toHaveBeenCalledWith('deleted_at', 'is', null);
      expect(mockEq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should query snoozed folder', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockIsDeleted = vi.fn().mockReturnValue({ gt: mockGt });
      const mockEq = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      await request(app).get('/api/contacts?folder=snoozed');
      expect(mockGt).toHaveBeenCalledWith('snoozed_until', expect.any(String));
      expect(mockEq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should query other folder (archive)', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockIsDeleted = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      await request(app).get('/api/contacts?folder=archive');
      expect(mockIsDeleted).toHaveBeenCalledWith('deleted_at', null);
      expect(mockEq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should return 500 when supabase returns error object in get contacts', async () => {
      const mockRange = vi
        .fn()
        .mockResolvedValue({ data: null, count: 0, error: { message: 'DB Error' } });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockIsArchived = vi.fn().mockReturnValue({ or: mockOr });
      const mockIsDeleted = vi.fn().mockReturnValue({ is: mockIsArchived });
      const mockEq = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch contacts' });
    });

    it('should handle internal errors for get contacts', async () => {
      const mockRange = vi.fn().mockRejectedValue(new Error('DB Error'));
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockIsArchived = vi.fn().mockReturnValue({ or: mockOr });
      const mockIsDeleted = vi.fn().mockReturnValue({ is: mockIsArchived });
      const mockEq = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should get contact by id', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockEqTenant = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts/123');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '123' });
      expect(mockEqId).toHaveBeenCalledWith('id', '123');
      expect(mockEqTenant).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should get contact without tenantId filter when admin', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockEqId = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }, 'admin', ''),
      } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts/123');
      expect(response.status).toBe(200);
      expect(mockEqId).toHaveBeenCalledWith('id', '123');
    });

    it('should handle get by id error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEqTenant = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ select: mockSelect }),
      } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts/123');
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update a contact with various fields and without tenantId when admin', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqId = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ update: mockUpdate }, 'admin', ''),
      } as unknown as SupabaseClient;

      const payload = {
        is_read: true,
        is_archived: true,
        snoozed_until: '2026-10-10T00:00:00.000Z',
        deleted_at: '2026-08-18T00:00:00.000Z',
        is_spam: true,
      };
      const response = await request(app).put('/api/contacts/123').send(payload);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '123' });
      expect(mockUpdate).toHaveBeenCalledWith({
        is_read: true,
        is_archived: true,
        snoozed_until: '2026-10-10T00:00:00.000Z',
        deleted_at: '2026-08-18T00:00:00.000Z',
        isSpam: true,
      });
      expect(mockEqId).toHaveBeenCalledWith('id', '123');
    });

    it('should update a contact with isSpam boolean and tenantId', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqTenant = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ update: mockUpdate }),
      } as unknown as SupabaseClient;

      const payload = { isSpam: false };
      const response = await request(app).put('/api/contacts/123').send(payload);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '123' });
      expect(mockUpdate).toHaveBeenCalledWith({ isSpam: false });
      expect(mockEqId).toHaveBeenCalledWith('id', '123');
      expect(mockEqTenant).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should skip undefined fields during update', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqTenant = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ update: mockUpdate }),
      } as unknown as SupabaseClient;

      const response = await request(app).put('/api/contacts/123').send({});
      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({});
    });

    it('should handle update error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Err' } });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqTenant = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ update: mockUpdate }),
      } as unknown as SupabaseClient;

      const response = await request(app).put('/api/contacts/123').send({});
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/contacts/trash/empty', () => {
    it('should empty trash with tenantId', async () => {
      const mockEqTenant = vi.fn().mockResolvedValue({ error: null });
      const mockNot = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockDelete = vi.fn().mockReturnValue({ not: mockNot });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/trash/empty');
      expect(response.status).toBe(204);
      expect(mockNot).toHaveBeenCalledWith('deleted_at', 'is', null);
      expect(mockEqTenant).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should empty trash without tenantId when admin', async () => {
      const mockNot = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ not: mockNot });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }, 'admin', ''),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/trash/empty');
      expect(response.status).toBe(204);
      expect(mockNot).toHaveBeenCalledWith('deleted_at', 'is', null);
    });

    it('should handle error emptying trash', async () => {
      const mockEqTenant = vi.fn().mockResolvedValue({ error: { message: 'Err' } });
      const mockNot = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockDelete = vi.fn().mockReturnValue({ not: mockNot });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/trash/empty');
      expect(response.status).toBe(500);
    });

    it('should catch generic error emptying trash', async () => {
      const mockEqTenant = vi.fn().mockRejectedValue(new Error('err'));
      const mockNot = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockDelete = vi.fn().mockReturnValue({ not: mockNot });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/trash/empty');
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should hard delete a contact with tenantId', async () => {
      const mockEqTenant = vi.fn().mockResolvedValue({ error: null });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/123');
      expect(response.status).toBe(204);
      expect(mockEqId).toHaveBeenCalledWith('id', '123');
      expect(mockEqTenant).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    });

    it('should hard delete a contact without tenantId when admin', async () => {
      const mockEqId = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }, 'admin', ''),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/123');
      expect(response.status).toBe(204);
      expect(mockEqId).toHaveBeenCalledWith('id', '123');
    });

    it('should handle delete error', async () => {
      const mockEqTenant = vi.fn().mockResolvedValue({ error: { message: 'Err' } });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/123');
      expect(response.status).toBe(500);
    });

    it('should catch generic delete error', async () => {
      const mockEqTenant = vi.fn().mockRejectedValue(new Error('err'));
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqTenant });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqId });

      backendService.supabaseAdmin = {
        from: createAuthFromMock({ delete: mockDelete }),
      } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/123');
      expect(response.status).toBe(500);
    });
  });
});
