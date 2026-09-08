import { describe, it, expect, vi, beforeEach } from 'vitest';
import subscriberHandler from './subscriber';

describe('POST /subscriber', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('SENDER_API_TOKEN', 'fake_token');
    vi.restoreAllMocks();
  });

  it('returns 404 for non-POST methods', async () => {
    const req = { method: 'GET' } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('returns 400 if email is missing', async () => {
    const req = { method: 'POST', body: {} } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
  });

  it('returns 400 for unsupported providers', async () => {
    const req = {
      method: 'POST',
      body: { email: 'test@example.com', provider: 'unknown' },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unsupported provider' });
  });

  it('returns 500 if SENDER_API_TOKEN is missing', async () => {
    vi.unstubAllEnvs();

    const req = {
      method: 'POST',
      body: { email: 'test@example.com', provider: 'sender', trigger_automation: true },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
  });

  it('subscribes successfully via sender.net', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      body: { email: 'test@example.com', provider: 'sender', trigger_automation: true },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(fetchMock).toHaveBeenCalledWith('https://api.sender.net/v2/subscribers', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake_token',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com', trigger_automation: true }),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns appropriate error status if sender.net fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Invalid email',
    });
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      body: { email: 'bademail', provider: 'sender', trigger_automation: true },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to subscribe' });
  });

  it('handles the "none" mock provider successfully', async () => {
    const req = {
      method: 'POST',
      body: { email: 'test@example.com', provider: 'none' },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Mock subscription successful',
    });
  });

  it('handles unexpected exceptions', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      body: { email: 'test@example.com', provider: 'sender', trigger_automation: true },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await subscriberHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
