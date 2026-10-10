import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSupabaseClient } from './supabase';

const { mockFrom, mockCheckBotId } = vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
  return {
    mockFrom: vi.fn(),
    mockCheckBotId: vi.fn().mockResolvedValue({ isBot: false }),
  };
});

vi.mock('botid/server', () => ({
  checkBotId: mockCheckBotId,
}));

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn().mockReturnValue({
      from: mockFrom,
    }),
  };
});

import contactsHandler from './contacts';
import { createRequestMock } from './test-utils';
const request = createRequestMock(contactsHandler);

describe('Contacts 2 API (Vercel Node)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
    mockCheckBotId.mockResolvedValue({ isBot: false });
  });

  describe('POST /api/contacts', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request().post('/api/contacts').send({
        name: 'John',
        // missing email, subject, and message
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Name, email, subject, and message are required' });
    });

    it('should return 400 if req.body is undefined', async () => {
      const res = await request().post('/api/contacts');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Name, email, subject, and message are required' });
    });

    it('should successfully post a contact from human with isSpam=false and deleted_at=null', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          message: 'Hello',
          isSpam: false,
          deleted_at: null,
        },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const res = await request().post('/api/contacts').send({
        name: 'John',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'Hello',
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        message: 'Hello',
        isSpam: false,
        deleted_at: null,
      });
      expect(mockInsert).toHaveBeenCalledWith([
        {
          name: 'John',
          email: 'john@example.com',
          subject: 'Inquiry',
          message: 'Hello',
          isSpam: false,
          deleted_at: null,
        },
      ]);
    });

    it('should mark contact as spam and in Trash if bot is detected', async () => {
      mockCheckBotId.mockResolvedValueOnce({ isBot: true });

      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 2,
          name: 'Bot',
          email: 'bot@example.com',
          message: 'Buy spam',
          isSpam: true,
          deleted_at: '2026-09-27T00:00:00.000Z',
        },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const res = await request().post('/api/contacts').send({
        name: 'Bot',
        email: 'bot@example.com',
        subject: 'Spam Subject',
        message: 'Buy spam',
      });

      expect(res.status).toBe(201);
      expect(mockCheckBotId).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith([
        {
          name: 'Bot',
          email: 'bot@example.com',
          subject: 'Spam Subject',
          message: 'Buy spam',
          isSpam: true,
          deleted_at: expect.any(String),
        },
      ]);
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
        subject: 'Inquiry',
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
        subject: 'Inquiry',
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
