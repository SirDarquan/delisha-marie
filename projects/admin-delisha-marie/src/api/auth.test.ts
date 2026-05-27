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
      } as unknown as Awaited<ReturnType<typeof backendService.supabase.auth.signInWithIdToken>>);

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

      const res = await request(app)
        .post('/auth/descope/register')
        .send({
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
});
