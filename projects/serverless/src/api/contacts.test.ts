import { beforeEach, describe, expect, it, vi } from 'vitest';
import contactsHandler from './contacts';
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

import { createRequestMock } from './test-utils';
const request = createRequestMock(contactsHandler);

describe('Contacts 2 API (Vercel Node)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
  });

  describe('POST /api/contacts', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request().post('/api/contacts').send({
        name: 'John',
        // missing email and message
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Name, email, and message are required' });
    });

    it('should successfully post a contact and return 201', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 1, name: 'John', email: 'john@example.com', message: 'Hello' },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const res = await request().post('/api/contacts').send({
        name: 'John',
        email: 'john@example.com',
        message: 'Hello',
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        message: 'Hello',
      });
    });

    it('should return 500 if database error occurs', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('DB Error'),
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const res = await request().post('/api/contacts').send({
        name: 'John',
        email: 'john@example.com',
        message: 'Hello',
      });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to save contact message' });
    });

    it('should return 404 for GET request on /api/contacts', async () => {
      const res = await request().get('/api/contacts');
      expect(res.status).toBe(404);
    });

    it('should handle unhandled exceptions with 500', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw new Error('Sync error');
      });

      const res = await request().post('/api/contacts').send({
        name: 'John',
        email: 'john@example.com',
        message: 'Hello',
      });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });
  it('should handle undefined req.body', async () => {
    const res = await request().post('/api/contacts').send(undefined);
    expect(res.status).toBe(400);
  });
});
