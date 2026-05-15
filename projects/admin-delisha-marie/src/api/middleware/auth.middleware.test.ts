/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. Explicitly declare mock functions outside to track calls
const { mockRefreshSession } = vi.hoisted(() => ({
  mockRefreshSession: vi.fn(),
}));

// 2. Mock the supabase client globally
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: {
      refreshSession: mockRefreshSession,
    },
  })),
}));

// 3. Standard imports
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './auth.middleware';
import { backendService } from '../supabase-backend.service';

// 4. Instrument backendService methods so they can be mocked dynamically
vi.spyOn(backendService, 'verifyToken');

describe('Auth Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();

    // Explicitly override singleton supabase client with mock client
    backendService.supabase = {
      auth: {
        refreshSession: mockRefreshSession,
      },
    } as any;

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Setup a test endpoint that uses the middleware
    app.get('/test-secure', authMiddleware, (req, res) => {
      res.json({ message: 'Success', user: (req as any).user, token: (req as any).token });
    });
  });

  it('should pass and call next when a valid access token is provided', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.mocked(backendService.verifyToken).mockResolvedValue(mockUser as any);

    const res = await request(app)
      .get('/test-secure')
      .set('Cookie', ['admin_access_token=valid-token']);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Success',
      user: mockUser,
      token: 'valid-token',
    });
    expect(backendService.verifyToken).toHaveBeenCalledWith('valid-token');
  });

  it('should refresh the session and call next when the access token is expired but a valid refresh token exists', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
    };

    // Simulate expired token
    vi.mocked(backendService.verifyToken).mockRejectedValue(new Error('token has expired'));
    vi.mocked(backendService.supabase.auth.refreshSession).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    } as any);

    const res = await request(app)
      .get('/test-secure')
      .set('Cookie', ['admin_access_token=expired-token', 'admin_refresh_token=valid-refresh']);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Success',
      user: mockUser,
      token: 'new-access-token',
    });

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes('admin_access_token=new-access-token'))).toBe(
      true,
    );
    expect(cookies.some((c: string) => c.includes('admin_refresh_token=new-refresh-token'))).toBe(
      true,
    );
  });

  it('should return 401 when no tokens are provided', async () => {
    const res = await request(app).get('/test-secure');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token missing or invalid');
  });

  it('should return 401 when access token is invalid and no refresh token is provided', async () => {
    vi.mocked(backendService.verifyToken).mockRejectedValue(new Error('Invalid token signature'));

    const res = await request(app)
      .get('/test-secure')
      .set('Cookie', ['admin_access_token=bad-token']);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized: Invalid token signature');
  });

  it('should return 401 when refresh session fails', async () => {
    vi.mocked(backendService.verifyToken).mockRejectedValue(new Error('token has expired'));
    vi.mocked(backendService.supabase.auth.refreshSession).mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('Invalid refresh token'),
    } as any);

    const res = await request(app)
      .get('/test-secure')
      .set('Cookie', ['admin_access_token=expired-token', 'admin_refresh_token=bad-refresh']);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized: Invalid refresh token');
  });

  it('should return 401 when refresh returns empty data without explicitly throwing', async () => {
    vi.mocked(backendService.verifyToken).mockRejectedValue(new Error('token has expired'));
    vi.mocked(backendService.supabase.auth.refreshSession).mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    } as any);

    const res = await request(app)
      .get('/test-secure')
      .set('Cookie', ['admin_access_token=expired-token', 'admin_refresh_token=bad-refresh']);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token missing or invalid');
  });
});
