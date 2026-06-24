import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DescopeClient from '@descope/node-sdk';

// Ensure Env vars exist before static initialization in imported modules
vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

// 1. Explicitly declare mock functions outside to track calls
const {
  mockRpc,
  mockSignUp,
  mockSignInWithPassword,
  mockSignInWithIdToken,
  mockSignOut,
  mockRefreshSession,
  mockGetUser,
  mockOtpSignUpOrIn,
  mockOtpVerify,
  mockUserCreate,
  mockUserUpdate,
  mockListUsers,
  mockUpdateUserById,
  mockCreateUser,
  mockGenerateLink,
  mockVerifyOtp,
  mockValidateSession,
} = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignInWithIdToken: vi.fn(),
  mockSignOut: vi.fn(),
  mockRefreshSession: vi.fn(),
  mockGetUser: vi.fn(),
  mockOtpSignUpOrIn: { email: vi.fn() },
  mockOtpVerify: { email: vi.fn() },
  mockUserCreate: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockListUsers: vi.fn(),
  mockUpdateUserById: vi.fn(),
  mockCreateUser: vi.fn(),
  mockGenerateLink: vi.fn(),
  mockVerifyOtp: vi.fn(),
  mockValidateSession: vi.fn(),
}));

// Mock descope client
vi.mock('@descope/node-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    validateSession: mockValidateSession,
    otp: {
      signUpOrIn: mockOtpSignUpOrIn,
      verify: mockOtpVerify,
    },
    management: {
      user: {
        create: mockUserCreate,
        update: mockUserUpdate,
      },
    },
  })),
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
        verifyOtp: mockVerifyOtp,
      },
    } as unknown as typeof backendService.supabase;

    backendService.supabaseAdmin = {
      rpc: mockRpc,
      auth: {
        signUp: mockSignUp,
        signInWithPassword: mockSignInWithPassword,
        signInWithIdToken: mockSignInWithIdToken,
        signOut: mockSignOut,
        refreshSession: mockRefreshSession,
        getUser: mockGetUser,
        admin: {
          listUsers: mockListUsers,
          updateUserById: mockUpdateUserById,
          createUser: mockCreateUser,
          generateLink: mockGenerateLink,
        },
      },
    } as unknown as typeof backendService.supabaseAdmin;

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
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signUp>>);

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
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signInWithPassword>>);

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
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

      vi.mocked(backendService.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signInWithPassword>>);

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
      vi.mocked(backendService.supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);
      vi.mocked(backendService.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: '1' } as unknown, session: { access_token: 'a' } as unknown },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signInWithPassword>>);

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

  describe('POST /auth/descope/verify-oauth', () => {
    beforeEach(() => {
      process.env['DESCOPE_PROJECT_ID'] = 'mock-project';
    });

    afterEach(() => {
      delete process.env['DESCOPE_PROJECT_ID'];
    });

    it('should successfully login an existing user', async () => {
      const email = 'existing@example.com';
      const descopeToken = 'valid-token';
      const mockUser = { id: 'user-id', email };
      const mockSession = {
        access_token: 'supabase-access',
        refresh_token: 'supabase-refresh',
        expires_in: 3600,
      };

      vi.mocked(mockValidateSession).mockResolvedValue({} as unknown);
      vi.mocked(mockListUsers).mockResolvedValue({
        data: { users: [mockUser] },
        error: null,
      } as unknown);

      vi.mocked(mockGenerateLink).mockResolvedValue({
        data: { properties: { hashed_token: 'hash123' } },
        error: null,
      } as unknown);

      vi.mocked(mockVerifyOtp).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      } as unknown);

      const res = await request(app)
        .post('/auth/descope/verify-oauth')
        .send({ email, descopeToken });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        isNewUser: false,
        session: mockSession,
        user: mockUser,
      });

      expect(mockValidateSession).toHaveBeenCalledWith(descopeToken);
      expect(mockListUsers).toHaveBeenCalled();
      expect(mockGenerateLink).toHaveBeenCalledWith({
        type: 'magiclink',
        email,
      });
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        token_hash: 'hash123',
        type: 'magiclink',
      });
    });

    it('should return isNewUser: true if the user does not exist in Supabase', async () => {
      const email = 'newuser@example.com';
      const descopeToken = 'valid-token';

      vi.mocked(mockValidateSession).mockResolvedValue({} as unknown);
      vi.mocked(mockListUsers).mockResolvedValue({
        data: { users: [] },
        error: null,
      } as unknown);

      const res = await request(app)
        .post('/auth/descope/verify-oauth')
        .send({ email, descopeToken });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        isNewUser: true,
        descopeToken,
        user: { email },
      });
    });

    it('should return 400 if email or token is missing', async () => {
      const res = await request(app).post('/auth/descope/verify-oauth').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and Descope token are required');
    });

    it('should return 401 if Descope session validation throws an error', async () => {
      vi.mocked(mockValidateSession).mockRejectedValue(new Error('Invalid session'));

      const res = await request(app)
        .post('/auth/descope/verify-oauth')
        .send({ email: 'test@example.com', descopeToken: 'bad-token' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid verification session token. Please verify OTP again.');
    });

    it('should return 400 if a general exception is thrown', async () => {
      vi.mocked(mockValidateSession).mockResolvedValue({} as unknown);
      vi.mocked(mockListUsers).mockRejectedValue(new Error('Supabase listing failed'));

      const res = await request(app)
        .post('/auth/descope/verify-oauth')
        .send({ email: 'test@example.com', descopeToken: 'valid-token' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Supabase listing failed');
    });
  });

  describe('POST /auth/signout', () => {
    it('should successfully sign out and clear cookies', async () => {
      vi.mocked(backendService.supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signOut>>);

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
      vi.mocked(backendService.verifyToken).mockResolvedValue(
        mockUser as unknown as Awaited<ReturnType<typeof backendService.verifyToken>>,
      );

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
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.refreshSession>>);

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
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

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
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

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

  describe('POST /auth/descope/send-otp', () => {
    it('should send Descope OTP successfully', async () => {
      vi.mocked(backendService.supabase.rpc).mockResolvedValue({
        data: true,
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

      vi.mocked(mockOtpSignUpOrIn.email).mockResolvedValue({
        ok: true,
      } as unknown as Awaited<ReturnType<typeof mockOtpSignUpOrIn.email>>);

      const res = await request(app)
        .post('/auth/descope/send-otp')
        .send({ email: 'new@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, isNewUser: true });
      expect(mockOtpSignUpOrIn.email).toHaveBeenCalledWith('new@example.com');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/auth/descope/send-otp').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email is required');
    });

    it('should return 400 if Descope OTP dispatch fails', async () => {
      vi.mocked(backendService.supabase.rpc).mockResolvedValue({
        data: false,
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

      vi.mocked(mockOtpSignUpOrIn.email).mockResolvedValue({
        ok: false,
        error: { errorDescription: 'Descope OTP failure' },
      } as unknown as Awaited<ReturnType<typeof mockOtpSignUpOrIn.email>>);

      const res = await request(app)
        .post('/auth/descope/send-otp')
        .send({ email: 'fail@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Descope OTP failure');
    });

    it('should return 400 with fallback error message if Descope OTP dispatch fails without errorDescription', async () => {
      vi.mocked(backendService.supabase.rpc).mockResolvedValue({
        data: false,
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

      vi.mocked(mockOtpSignUpOrIn.email).mockResolvedValue({
        ok: false,
        error: {},
      } as unknown as Awaited<ReturnType<typeof mockOtpSignUpOrIn.email>>);

      const res = await request(app)
        .post('/auth/descope/send-otp')
        .send({ email: 'fail@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Failed to send OTP');
    });

    it('should return 400 if internal call throws an error', async () => {
      vi.mocked(backendService.supabase.rpc).mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/auth/descope/send-otp')
        .send({ email: 'error@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Database error');
    });
  });

  describe('POST /auth/descope/verify-otp', () => {
    it('should return 400 if email or code is missing', async () => {
      const res = await request(app).post('/auth/descope/verify-otp').send({ email: 'x@y.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and OTP code are required');
    });

    it('should return 401 if Descope OTP verification fails', async () => {
      vi.mocked(mockOtpVerify.email).mockResolvedValue({
        ok: false,
        error: { errorDescription: 'Invalid code' },
      } as unknown as Awaited<ReturnType<typeof mockOtpVerify.email>>);

      const res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'x@y.com', code: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid code');
    });

    it('should return isNewUser: true if user is not in Supabase', async () => {
      vi.mocked(mockOtpVerify.email).mockResolvedValue({
        ok: true,
        data: { sessionJwt: 'descope-session-jwt' },
      } as unknown as Awaited<ReturnType<typeof mockOtpVerify.email>>);

      vi.mocked(mockListUsers).mockResolvedValue({
        data: { users: [] },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.listUsers>
      >);

      const res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'new@example.com', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        isNewUser: true,
        descopeToken: 'descope-session-jwt',
        user: { email: 'new@example.com' },
      });
    });

    it('should sign in passwordlessly for existing user', async () => {
      vi.mocked(mockOtpVerify.email).mockResolvedValue({
        ok: true,
        data: { sessionJwt: 'descope-session-jwt' },
      } as unknown as Awaited<ReturnType<typeof mockOtpVerify.email>>);

      vi.mocked(mockListUsers).mockResolvedValue({
        data: { users: [{ id: 'existing-id', email: 'exist@example.com' }] },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.listUsers>
      >);

      vi.mocked(mockGenerateLink).mockResolvedValue({
        data: { properties: { hashed_token: 'link-token-hash' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);

      vi.mocked(mockVerifyOtp).mockResolvedValue({
        data: {
          session: {
            access_token: 'sb-access-token',
            refresh_token: 'sb-refresh-token',
            expires_in: 3600,
          },
          user: { id: 'existing-id', email: 'exist@example.com' },
        },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.verifyOtp>>);

      const res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'exist@example.com', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isNewUser).toBe(false);
      expect(res.body.session).toBeDefined();
      expect(res.header['set-cookie']).toBeDefined();
      expect(mockGenerateLink).toHaveBeenCalledWith({
        type: 'magiclink',
        email: 'exist@example.com',
      });
    });

    it('should return 400 if internal call throws an error', async () => {
      vi.mocked(mockOtpVerify.email).mockRejectedValue(new Error('Descope verification error'));

      const res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'error@example.com', code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Descope verification error');
    });
  });

  describe('POST /auth/descope/register', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post('/auth/descope/register').send({ email: 'x@y.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('All fields are required');
    });

    it('should succeed registration and return session/cookies', async () => {
      vi.mocked(mockRpc).mockResolvedValue({
        data: true, // username is available
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

      vi.mocked(mockCreateUser).mockResolvedValue({
        data: { user: { id: 'new-id', email: 'new@example.com' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.createUser>
      >);

      vi.mocked(mockGenerateLink).mockResolvedValue({
        data: { properties: { hashed_token: 'link-token-hash' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);

      vi.mocked(mockVerifyOtp).mockResolvedValue({
        data: {
          session: {
            access_token: 'sb-access-token',
            refresh_token: 'sb-refresh-token',
            expires_in: 3600,
          },
          user: { id: 'new-id', email: 'new@example.com' },
        },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.verifyOtp>>);

      const res = await request(app).post('/auth/descope/register').send({
        email: 'new@example.com',
        descopeToken: 'valid-descope-token',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.session).toBeDefined();
      expect(res.header['set-cookie']).toBeDefined();
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'new@example.com',
        email_confirm: true,
        user_metadata: {
          first_name: 'John',
          last_name: 'Doe',
          display_name: 'John Doe',
          username: 'johndoe',
        },
      });
    });

    it('should return 400 if registration throws an error', async () => {
      vi.mocked(mockRpc).mockRejectedValue(new Error('RPC registration error'));

      const res = await request(app).post('/auth/descope/register').send({
        email: 'error@example.com',
        descopeToken: 'valid-descope-token',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('RPC registration error');
    });
  });

  describe('Auth API Coverage Boosters', () => {
    beforeEach(() => {
      process.env['DESCOPE_MANAGEMENT_KEY'] = 'test-mgmt-key';

      // Setup default successful mocks for the registration flow
      vi.mocked(mockRpc).mockResolvedValue({
        data: true,
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);
      vi.mocked(mockCreateUser).mockResolvedValue({
        data: { user: { id: 'new-id', email: 'new@example.com' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.createUser>
      >);
      vi.mocked(mockGenerateLink).mockResolvedValue({
        data: { properties: { hashed_token: 'link-token-hash' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);
      vi.mocked(mockVerifyOtp).mockResolvedValue({
        data: {
          session: {
            access_token: 'sb-access-token',
            refresh_token: 'sb-refresh-token',
            expires_in: 3600,
          },
          user: { id: 'new-id', email: 'new@example.com' },
        },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.verifyOtp>>);
      vi.mocked(mockValidateSession).mockResolvedValue(undefined);
      vi.mocked(mockUserCreate).mockResolvedValue({
        ok: true,
      } as unknown as Awaited<
        ReturnType<ReturnType<typeof DescopeClient>['management']['user']['create']>
      >);
      vi.mocked(mockUserUpdate).mockResolvedValue({
        ok: true,
      } as unknown as Awaited<
        ReturnType<ReturnType<typeof DescopeClient>['management']['user']['update']>
      >);
    });

    afterEach(() => {
      delete process.env['DESCOPE_MANAGEMENT_KEY'];
    });

    it('should cover cleanEnvValue helper logic for quotes and placeholder strings', async () => {
      const originalProjectId = process.env['DESCOPE_PROJECT_ID'];
      process.env['DESCOPE_PROJECT_ID'] = '"test-quoted-id"';

      const res = await request(app).post('/auth/descope/send-otp').send({
        email: 'test@example.com',
      });
      expect(res.status).toBeDefined();

      process.env['DESCOPE_PROJECT_ID'] = 'undefined';
      await request(app).post('/auth/descope/send-otp').send({
        email: 'test@example.com',
      });

      if (originalProjectId) {
        process.env['DESCOPE_PROJECT_ID'] = originalProjectId;
      } else {
        delete process.env['DESCOPE_PROJECT_ID'];
      }
    });

    it('should throw an error in signInPasswordlessly when tokenHash is missing', async () => {
      vi.mocked(mockGenerateLink).mockResolvedValue({
        data: { properties: {} },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);

      vi.mocked(mockOtpVerify.email).mockResolvedValue({
        ok: true,
        data: { sessionJwt: 'jwt' },
      } as unknown as Awaited<
        ReturnType<ReturnType<typeof DescopeClient>['otp']['verify']['email']>
      >);
      vi.mocked(mockListUsers).mockResolvedValue({
        data: { users: [{ id: 'user-id', email: 'sirda@example.com' }] },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.listUsers>
      >);

      const res = await request(app).post('/auth/descope/verify-otp').send({
        email: 'sirda@example.com',
        code: '123456',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Failed to generate secure verification token');
    });

    it('should cover validateDescopeSession try-catch offline decryption fallbacks', async () => {
      vi.mocked(mockValidateSession).mockRejectedValue(new Error('Session validation failed'));

      const payload = { exp: Math.floor(Date.now() / 1000) - 10 };
      const mockToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const res1 = await request(app).post('/auth/descope/register').send({
        email: 'new@example.com',
        descopeToken: mockToken,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(res1.status).toBe(401);
      expect(res1.body.error).toContain('expired');

      const res2 = await request(app).post('/auth/descope/register').send({
        email: 'new@example.com',
        descopeToken: 'completely-invalid-token',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(res2.status).toBe(401);
      expect(res2.body.error).toContain('Invalid verification session token');
    });

    it('should cover syncDescopeUser management API failures', async () => {
      await request(app).post('/auth/descope/register').send({
        email: 'new@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(mockUserCreate).toHaveBeenCalled();

      vi.mocked(mockUserCreate).mockRejectedValue(new Error('User already exists'));
      await request(app).post('/auth/descope/register').send({
        email: 'new@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(mockUserUpdate).toHaveBeenCalled();

      vi.mocked(mockUserUpdate).mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      await request(app).post('/auth/descope/register').send({
        email: 'new@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should cover username generation fallback when displayName consists only of special characters', async () => {
      const res = await request(app).post('/auth/descope/register').send({
        email: 'special-char-user@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: '!!!',
      });
      expect(res.status).toBe(200);
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_metadata: expect.objectContaining({
            username: 'specialcharuser',
          }),
        }),
      );
    });

    it('should cover username collision while loop in generateUniqueUsername', async () => {
      vi.mocked(mockRpc)
        .mockResolvedValueOnce({
          data: false,
          error: null,
        } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>)
        .mockResolvedValueOnce({
          data: false,
          error: null,
        } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>)
        .mockResolvedValueOnce({
          data: true,
          error: null,
        } as unknown as Awaited<ReturnType<typeof backendService.supabase.rpc>>);

      const res = await request(app).post('/auth/descope/register').send({
        email: 'collision@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'Collision',
      });
      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledTimes(3);
    });

    it('should cover raw string errors thrown from signUp, signInWithPassword, signOut, and RPC calls', async () => {
      // 1. signUp raw string throw in POST /auth/signup
      vi.mocked(mockSignUp).mockRejectedValueOnce('raw string signup error');
      let res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('raw string signup error');

      // 2. signInWithPassword raw string throw in POST /auth/login
      vi.mocked(mockSignInWithPassword).mockRejectedValueOnce('raw string login error');
      res = await request(app)
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'password' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('raw string login error');

      // 3. signOut raw string throw in POST /auth/signout
      vi.mocked(mockSignOut).mockRejectedValueOnce('raw string signout error');
      res = await request(app).post('/auth/signout').send();
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('raw string signout error');

      // 4. isUsernameAvailable raw string throw in GET /auth/check-username
      vi.mocked(mockRpc).mockRejectedValueOnce('raw string rpc error');
      res = await request(app).get('/auth/check-username?username=john').send();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('raw string rpc error');

      // 5. isEmailAvailable raw string throw in GET /auth/check-email
      vi.mocked(mockRpc).mockRejectedValueOnce('raw string rpc error');
      res = await request(app).get('/auth/check-email?email=test@test.com').send();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('raw string rpc error');

      // 6. getEmailByUsername raw string throw in POST /auth/login
      vi.mocked(mockRpc).mockRejectedValueOnce('raw string rpc error');
      res = await request(app)
        .post('/auth/login')
        .send({ username: 'username_no_at', password: 'password' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('raw string rpc error');
    });

    it('should cover database linkError, sessionError, and createError throws', async () => {
      // 1. linkError throw in signInPasswordlessly
      vi.mocked(mockGenerateLink).mockResolvedValueOnce({
        data: null,
        error: new Error('Link generation failed'),
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);
      vi.mocked(mockOtpVerify.email).mockResolvedValueOnce({
        ok: true,
        data: { sessionJwt: 'jwt' },
      } as unknown as Awaited<
        ReturnType<ReturnType<typeof DescopeClient>['otp']['verify']['email']>
      >);
      vi.mocked(mockListUsers).mockResolvedValueOnce({
        data: { users: [{ id: 'user-id', email: 'john@example.com' }] },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.listUsers>
      >);
      let res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'john@example.com', code: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Link generation failed');

      // 2. sessionError throw in signInPasswordlessly
      vi.mocked(mockGenerateLink).mockResolvedValueOnce({
        data: { properties: { hashed_token: 'hash' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);
      vi.mocked(mockVerifyOtp).mockResolvedValueOnce({
        data: null,
        error: new Error('Session verification failed'),
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.verifyOtp>>);
      vi.mocked(mockOtpVerify.email).mockResolvedValueOnce({
        ok: true,
        data: { sessionJwt: 'jwt' },
      } as unknown as Awaited<
        ReturnType<ReturnType<typeof DescopeClient>['otp']['verify']['email']>
      >);
      vi.mocked(mockListUsers).mockResolvedValueOnce({
        data: { users: [{ id: 'user-id', email: 'john@example.com' }] },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.listUsers>
      >);
      res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'john@example.com', code: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Session verification failed');

      // 3. createError throw in /auth/descope/register
      vi.mocked(mockCreateUser).mockResolvedValueOnce({
        data: null,
        error: new Error('Supabase create user error'),
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.createUser>
      >);
      res = await request(app).post('/auth/descope/register').send({
        email: 'john@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Supabase create user error');
    });

    it('should cover cases with empty/falsy session returns across endpoints', async () => {
      // 1. signUp returning null session in POST /auth/signup
      vi.mocked(mockSignUp).mockResolvedValueOnce({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signUp>>);
      let res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.session).toBeNull();

      // 2. signInWithPassword returning null session in POST /auth/login
      vi.mocked(mockSignInWithPassword).mockResolvedValueOnce({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signInWithPassword>>);
      res = await request(app)
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.session).toBeNull();

      // 3. register returning null session in POST /auth/descope/register
      vi.mocked(mockCreateUser).mockResolvedValueOnce({
        data: { user: { id: 'u1' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.createUser>
      >);
      vi.mocked(mockGenerateLink).mockResolvedValueOnce({
        data: { properties: { hashed_token: 'hash' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);
      vi.mocked(mockVerifyOtp).mockResolvedValueOnce({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.verifyOtp>>);
      res = await request(app).post('/auth/descope/register').send({
        email: 'john@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(res.status).toBe(200);
      expect(res.body.session).toBeNull();

      // 4. verify-oauth returning null session in POST /auth/descope/verify-oauth
      vi.mocked(mockListUsers).mockResolvedValueOnce({
        data: { users: [{ id: 'user-id', email: 'john@example.com' }] },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.listUsers>
      >);
      vi.mocked(mockGenerateLink).mockResolvedValueOnce({
        data: { properties: { hashed_token: 'hash' } },
        error: null,
      } as unknown as Awaited<
        ReturnType<typeof backendService.supabaseAdmin.auth.admin.generateLink>
      >);
      vi.mocked(mockVerifyOtp).mockResolvedValueOnce({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.verifyOtp>>);
      res = await request(app).post('/auth/descope/verify-oauth').send({
        email: 'john@example.com',
        descopeToken: 'valid.token.signature',
      });
      expect(res.status).toBe(200);
      expect(res.body.session).toBeNull();
    });

    it('should cover other miscellaneous branch error string throws in descope endpoints', async () => {
      // 1. send-otp catch block string error
      vi.mocked(mockRpc).mockRejectedValueOnce('send-otp rpc failure');
      let res = await request(app)
        .post('/auth/descope/send-otp')
        .send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('send-otp rpc failure');

      // 2. verify-otp catch block string error
      vi.mocked(mockOtpVerify.email).mockRejectedValueOnce('verify-otp otp failure');
      res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'john@example.com', code: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('verify-otp otp failure');

      // 3. register catch block string error
      vi.mocked(mockCreateUser).mockRejectedValueOnce('register create user failure');
      res = await request(app).post('/auth/descope/register').send({
        email: 'john@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('register create user failure');

      // 4. verify-oauth catch block string error
      vi.mocked(mockValidateSession).mockResolvedValueOnce(undefined);
      vi.mocked(mockListUsers).mockRejectedValueOnce('verify-oauth listUsers failure');
      res = await request(app).post('/auth/descope/verify-oauth').send({
        email: 'john@example.com',
        descopeToken: 'valid.token.signature',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('verify-oauth listUsers failure');
    });

    it('should cover all remaining unhit branches in auth.ts', async () => {
      // 1. Supabase RPC / Auth error propagation (Lines 58, 66, 74, 84, 93, 99, 223)
      // Line 58 check-username RPC error:
      vi.mocked(mockRpc).mockResolvedValueOnce({
        data: null,
        error: new Error('RPC check_username error'),
      } as unknown);
      let res = await request(app).get('/auth/check-username?username=john');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('RPC check_username error');

      // Line 66 check-email RPC error:
      vi.mocked(mockRpc).mockResolvedValueOnce({
        data: null,
        error: new Error('RPC check_email error'),
      } as unknown);
      res = await request(app).get('/auth/check-email?email=test@test.com');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('RPC check_email error');

      // Line 74 getEmailByUsername RPC error:
      vi.mocked(mockRpc).mockResolvedValueOnce({
        data: null,
        error: new Error('RPC get_email_by_username error'),
      } as unknown);
      res = await request(app).post('/auth/login').send({ username: 'john', password: 'pwd' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('RPC get_email_by_username error');

      // Line 84 signUp error:
      vi.mocked(mockSignUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('SignUp error'),
      } as unknown);
      res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('SignUp error');

      // Line 93 signInWithPassword error:
      vi.mocked(mockSignInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('SignIn error'),
      } as unknown);
      res = await request(app)
        .post('/auth/login')
        .send({ username: 'test@example.com', password: 'password' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('SignIn error');

      // Line 99 signOut error:
      vi.mocked(mockSignOut).mockResolvedValueOnce({
        error: new Error('SignOut error'),
      } as unknown);
      res = await request(app).post('/auth/signout');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('SignOut error');

      // Line 223 listUsers error:
      vi.mocked(mockListUsers).mockResolvedValueOnce({
        data: { users: [] },
        error: new Error('ListUsers error'),
      } as unknown);
      vi.mocked(mockOtpVerify.email).mockResolvedValueOnce({
        ok: true,
        data: { sessionJwt: 'jwt' },
      } as unknown);
      res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'john@example.com', code: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ListUsers error');

      // 2. Line 262: verifyResp.error?.errorDescription fallback to 'Invalid OTP code'
      vi.mocked(mockOtpVerify.email).mockResolvedValueOnce({ ok: false, error: {} } as unknown);
      res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'john@example.com', code: '123456' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid OTP code');

      // 3. Line 265: verifyResp.data?.sessionJwt fallback to ''
      vi.mocked(mockOtpVerify.email).mockResolvedValueOnce({ ok: true, data: {} } as unknown);
      vi.mocked(mockListUsers).mockResolvedValueOnce({
        data: { users: [] },
        error: null,
      } as unknown);
      res = await request(app)
        .post('/auth/descope/verify-otp')
        .send({ email: 'john@example.com', code: '123456' });
      expect(res.status).toBe(200);
      expect(res.body.descopeToken).toBe('');

      // 4. Line 324: displayName has no alphanumeric characters, email has no alphanumeric username
      vi.mocked(mockRpc).mockResolvedValueOnce({ data: true, error: null } as unknown);
      vi.mocked(mockCreateUser).mockResolvedValueOnce({
        data: { user: { id: 'u1' } },
        error: null,
      } as unknown);
      vi.mocked(mockGenerateLink).mockResolvedValueOnce({
        data: { properties: { hashed_token: 'hash' } },
        error: null,
      } as unknown);
      vi.mocked(mockVerifyOtp).mockResolvedValueOnce({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      } as unknown);
      res = await request(app).post('/auth/descope/register').send({
        email: '!!!@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: '!!!',
      });
      expect(res.status).toBe(200);

      // 5. Line 357: validateDescopeSession throws a non-Error string in /auth/descope/register
      vi.mocked(mockValidateSession).mockRejectedValueOnce(new Error('Validation error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementationOnce(() => {
        throw 'Raw Descope Validation Failure';
      });
      res = await request(app).post('/auth/descope/register').send({
        email: 'john@example.com',
        descopeToken: 'valid.token.signature',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John',
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Raw Descope Validation Failure');
      consoleErrorSpy.mockRestore();

      // 6. Line 405: validateDescopeSession throws a non-Error string in /auth/descope/verify-oauth
      vi.mocked(mockValidateSession).mockRejectedValueOnce(new Error('Validation error'));
      const consoleErrorSpy2 = vi.spyOn(console, 'error').mockImplementationOnce(() => {
        throw 'Raw Descope Validation Failure1';
      });
      res = await request(app).post('/auth/descope/verify-oauth').send({
        email: 'john@example.com',
        descopeToken: 'valid.token.signature',
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Raw Descope Validation Failure1');
      consoleErrorSpy2.mockRestore();
    });
  });
});
