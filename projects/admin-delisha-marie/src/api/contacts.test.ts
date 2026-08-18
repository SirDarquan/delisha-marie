import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import contactsRouter from './contacts';
import { backendService } from './supabase-backend.service';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Contacts API Router', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.resetAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api', contactsRouter);
  });

  describe('GET /api/contacts', () => {
    it('should return contacts from inbox by default', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [{ id: 1 }], count: 1, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockIsArchived = vi.fn().mockReturnValue({ or: mockOr });
      const mockIsDeleted = vi.fn().mockReturnValue({ is: mockIsArchived });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [{ id: 1 }], count: 1 });
      expect(mockFrom).toHaveBeenCalledWith('contacts');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
    });

    it('should query trash folder', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockNot = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ not: mockNot });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      await request(app).get('/api/contacts?folder=trash');
      expect(mockNot).toHaveBeenCalledWith('deleted_at', 'is', null);
    });

    it('should query snoozed folder', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockIsDeleted = vi.fn().mockReturnValue({ gt: mockGt });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      await request(app).get('/api/contacts?folder=snoozed');
      expect(mockGt).toHaveBeenCalledWith('snoozed_until', expect.any(String));
    });

    it('should query other folder (archive)', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockIsDeleted = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      await request(app).get('/api/contacts?folder=archive');
      expect(mockIsDeleted).toHaveBeenCalledWith('deleted_at', null);
    });

    it('should handle internal errors for get contacts', async () => {
      const mockRange = vi.fn().mockRejectedValue(new Error('DB Error'));
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockIsArchived = vi.fn().mockReturnValue({ or: mockOr });
      const mockIsDeleted = vi.fn().mockReturnValue({ is: mockIsArchived });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIsDeleted });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should get contact by id', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts/123');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '123' });
      expect(mockEq).toHaveBeenCalledWith('id', '123');
    });

    it('should handle get by id error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).get('/api/contacts/123');
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update a contact', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const payload = { is_read: true, deleted_at: '2026-08-18T00:00:00.000Z' };
      const response = await request(app).put('/api/contacts/123').send(payload);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '123' });
      expect(mockUpdate).toHaveBeenCalledWith(payload);
    });

    it('should skip undefined fields during update', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).put('/api/contacts/123').send({});
      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({});
    });

    it('should handle update error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Err' } });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).put('/api/contacts/123').send({});
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/contacts/trash/empty', () => {
    it('should empty trash', async () => {
      const mockNot = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ not: mockNot });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/trash/empty');
      expect(response.status).toBe(204);
      expect(mockNot).toHaveBeenCalledWith('deleted_at', 'is', null);
    });

    it('should handle error emptying trash', async () => {
      const mockNot = vi.fn().mockResolvedValue({ error: { message: 'Err' } });
      const mockDelete = vi.fn().mockReturnValue({ not: mockNot });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/trash/empty');
      expect(response.status).toBe(500);
    });

    it('should catch generic error emptying trash', async () => {
      const mockNot = vi.fn().mockRejectedValue(new Error('err'));
      const mockDelete = vi.fn().mockReturnValue({ not: mockNot });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/trash/empty');
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should hard delete a contact', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/123');
      expect(response.status).toBe(204);
      expect(mockEq).toHaveBeenCalledWith('id', '123');
    });

    it('should handle delete error', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Err' } });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/123');
      expect(response.status).toBe(500);
    });

    it('should catch generic delete error', async () => {
      const mockEq = vi.fn().mockRejectedValue(new Error('err'));
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      backendService.supabaseAdmin = { from: mockFrom } as unknown as SupabaseClient;

      const response = await request(app).delete('/api/contacts/123');
      expect(response.status).toBe(500);
    });
  });
});
