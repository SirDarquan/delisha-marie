/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. Explicitly declare mock functions outside to track calls
const {
  mockRpc,
  mockSignUp,
  mockSignInWithPassword,
  mockSignInWithIdToken,
  mockSignOut,
  mockRefreshSession,
  mockGetUser,
} = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignInWithIdToken: vi.fn(),
  mockSignOut: vi.fn(),
  mockRefreshSession: vi.fn(),
  mockGetUser: vi.fn(),
}));

// 2. Mock the supabase client globally
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    rpc: mockRpc,
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithIdToken: mockSignInWithIdToken,
      signOut: mockSignOut,
      refreshSession: mockRefreshSession,
      getUser: mockGetUser,
    },
  })),
}));

// 3. Ensure Env vars exist for static initialization
process.env['SUPABASE_URL'] = 'https://example.supabase.co';
process.env['SUPABASE_KEY'] = 'test-key';

// 4. Standard imports
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import authRouter from './auth';
import { backendService } from './supabase-backend.service';

// 5. Instrument backendService methods so they can be mocked dynamically
vi.spyOn(backendService, 'verifyToken');

describe('Auth Router API', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();

    // Explicitly assign mocked Supabase client to ensure it overrides standard instance
    backendService.supabase = {
      rpc: mockRpc,
      auth: {
        signUp: mockSignUp,
        signInWithPassword: mockSignInWithPassword,
        signInWithIdToken: mockSignInWithIdToken,
        signOut: mockSignOut,
        refreshSession: mockRefreshSession,
        getUser: mockGetUser,
      },
    } as any;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/', authRouter);
  });

  describe('POST /auth/signup', () => {
    it('should successfully sign up a new user and set cookies', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = {
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_in: 3600,
      };

      vi.mocked(backendService.supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password123', username: 'tester' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'User signed up successfully!',
        user: mockUser,
        session: mockSession,
      });

      // Assert cookies are set
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('admin_access_token=access-123'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('admin_refresh_token=refresh-123'))).toBe(true);
    });

    it('should return 400 if email or password is missing', async () => {
      const res = await request(app).post('/auth/signup').send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password are required');
    });

    it('should return 400 if signUp throws an error', async () => {
      vi.mocked(backendService.supabase.auth.signUp).mockRejectedValue(new Error('Signup failed'));

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Signup failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with email successfully and set cookies', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = {
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_in: 3600,
      };

      vi.mocked(backendService.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        user: mockUser,
        session: mockSession,
      });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('admin_access_token=access-123'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('admin_refresh_token=refresh-123'))).toBe(true);
    });

    it('should login with username mapping successfully and set cookies', async () => {
      const mockUser = { id: 'user-123', email: 'resolved@example.com' };
      const mockSession = {
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_in: 3600,
      };

      vi.mocked(backendService.supabase.rpc).mockResolvedValue({
        data: 'resolved@example.com',
        error: null,
      } as any);

      vi.mocked(backendService.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'tester', password: 'password123' });

      expect(res.status).toBe(200);
      expect(backendService.supabase.rpc).toHaveBeenCalledWith('get_email_by_username', {
        username: 'tester',
      });
      expect(backendService.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'resolved@example.com',
        password: 'password123',
      });
    });

    it('should fall back to computed email if username lookup yields null', async () => {
      vi.mocked(backendService.supabase.rpc).mockResolvedValue({ data: null, error: null } as any);
      vi.mocked(backendService.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: '1' } as any, session: { access_token: 'a' } as any },
        error: null,
      } as any);

      await request(app).post('/auth/login').send({ username: 'ghost', password: 'pw' });

      expect(backendService.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'ghost@example.com',
        password: 'pw',
      });
    });

    it('should return 401 if signInWithPassword fails', async () => {
      vi.mocked(backendService.supabase.auth.signInWithPassword).mockRejectedValue(
        new Error('Invalid login'),
      );

      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'password' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid login');
    });
  });

  describe('POST /auth/social-login', () => {
    it('should successfully handle social login', async () => {
      const mockUser = { id: 'user-123', email: 'google@example.com' };
      const mockSession = {
        access_token: 'access-google',
        refresh_token: 'refresh-google',
        expires_in: 3600,
      };

      vi.mocked(backendService.supabase.auth.signInWithIdToken).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

      const res = await request(app)
        .post('/auth/social-login')
        .send({ token: 'id-token-abc', provider: 'google' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        user: mockUser,
        session: mockSession,
      });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('admin_access_token=access-google'))).toBe(
        true,
      );
    });

    it('should return 400 if token is missing', async () => {
      const res = await request(app).post('/auth/social-login').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Token is required');
    });

    it('should return 400 if signInWithIdToken throws an error', async () => {
      vi.mocked(backendService.supabase.auth.signInWithIdToken).mockRejectedValue(
        new Error('Social error'),
      );

      const res = await request(app).post('/auth/social-login').send({ token: 'bad-token' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Social error');
    });
  });

  describe('POST /auth/signout', () => {
    it('should successfully sign out and clear cookies', async () => {
      vi.mocked(backendService.supabase.auth.signOut).mockResolvedValue({ error: null } as any);

      const res = await request(app).post('/auth/signout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Signed out successfully');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('admin_access_token=;'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('admin_refresh_token=;'))).toBe(true);
    });

    it('should return 500 if signOut throws an error', async () => {
      vi.mocked(backendService.supabase.auth.signOut).mockRejectedValue(
        new Error('Signout failed'),
      );

      const res = await request(app).post('/auth/signout');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Signout failed');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user details if access token is valid', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      vi.mocked(backendService.verifyToken).mockResolvedValue(mockUser as any);

      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', ['admin_access_token=valid-access']);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user: mockUser });
      expect(backendService.verifyToken).toHaveBeenCalledWith('valid-access');
    });

    it('should refresh session if access token is invalid/expired but refresh token is valid', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      vi.mocked(backendService.verifyToken).mockRejectedValue(new Error('Token expired'));
      vi.mocked(backendService.supabase.auth.refreshSession).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', ['admin_access_token=expired-access', 'admin_refresh_token=valid-refresh']);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user: mockUser });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('admin_access_token=new-access-token'))).toBe(
        true,
      );
    });

    it('should return 401 if no tokens are provided', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token missing or invalid');
    });
  });

  describe('GET /auth/check-username', () => {
    it('should return availability status', async () => {
      vi.mocked(backendService.supabase.rpc).mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const res = await request(app).get('/auth/check-username').query({ username: 'tester' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ available: true });
      expect(backendService.supabase.rpc).toHaveBeenCalledWith('check_username_available', {
        check_username: 'tester',
      });
    });

    it('should return 400 if username is missing', async () => {
      const res = await request(app).get('/auth/check-username');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username query parameter is required');
    });

    it('should return 400 if internal call throws', async () => {
      vi.mocked(backendService.supabase.rpc).mockRejectedValue(new Error('RPC Failure'));

      const res = await request(app).get('/auth/check-username').query({ username: 'baduser' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('RPC Failure');
    });
  });

  describe('GET /auth/check-email', () => {
    it('should return availability status', async () => {
      vi.mocked(backendService.supabase.rpc).mockResolvedValue({
        data: false,
        error: null,
      } as any);

      const res = await request(app).get('/auth/check-email').query({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ available: false });
      expect(backendService.supabase.rpc).toHaveBeenCalledWith('check_email_available', {
        check_email: 'test@example.com',
      });
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).get('/auth/check-email');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email query parameter is required');
    });

    it('should return 400 if internal call throws', async () => {
      vi.mocked(backendService.supabase.rpc).mockRejectedValue(new Error('Email Check Fail'));

      const res = await request(app).get('/auth/check-email').query({ email: 'x@y.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email Check Fail');
    });
  });
});
