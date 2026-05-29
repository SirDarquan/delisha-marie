import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { DescopeAuthConfig, DescopeAuthService } from '@descope/angular-sdk';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let fakeDescopeAuthService: {
    descopeSdk: {
      oauth: {
        start: ReturnType<typeof vi.fn>;
        exchange: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(() => {
    apiMock = {
      get: vi.fn().mockResolvedValue({}),
      post: vi.fn().mockResolvedValue({}),
      put: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    };

    fakeDescopeAuthService = {
      descopeSdk: {
        oauth: {
          start: vi.fn(),
          exchange: vi.fn(),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiMock },
        { provide: DescopeAuthConfig, useValue: { projectId: 'test-project' } },
        { provide: DescopeAuthService, useValue: fakeDescopeAuthService },
      ],
    });

    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for username availability when cleanUser is empty', async () => {
    const available = await service.isUsernameAvailable('  ');
    expect(available).toBe(false);
  });

  it('should call backend for username availability', async () => {
    apiMock.get.mockResolvedValue({ available: true });
    const available = await service.isUsernameAvailable('newuser');
    expect(apiMock.get).toHaveBeenCalledWith('/auth/check-username', {
      params: { username: 'newuser' },
    });
    expect(available).toBe(true);
  });

  it('should return false for username availability if backend fails', async () => {
    apiMock.get.mockRejectedValue(new Error('Network error'));
    const available = await service.isUsernameAvailable('newuser');
    expect(available).toBe(false);
  });

  it('should call backend for email availability', async () => {
    apiMock.get.mockResolvedValue({ available: false });
    const available = await service.isEmailAvailable('test@test.com');
    expect(apiMock.get).toHaveBeenCalledWith('/auth/check-email', {
      params: { email: 'test@test.com' },
    });
    expect(available).toBe(false);
  });

  it('should register a new user successfully via backend', async () => {
    apiMock.post.mockResolvedValue({ success: true });
    const success = await service.signUp({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'ComplexPassword123!',
    });
    expect(success).toBe(true);
    expect(apiMock.post).toHaveBeenCalledWith('/auth/signup', {
      email: 'john@example.com',
      password: 'ComplexPassword123!',
      username: 'johndoe',
    });
  });

  it('should log in with correct credentials via backend', async () => {
    const mockUser = { username: 'johndoe', email: 'john@example.com' };
    apiMock.post.mockResolvedValue({
      success: true,
      user: mockUser,
      session: { access_token: 'token123' },
    });

    const success = await service.login('johndoe', 'ComplexPassword123!');
    expect(success).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
  });

  it('should return false for invalid login credentials via backend', async () => {
    apiMock.post.mockResolvedValue({ success: false });
    const success = await service.login('invalid_user', 'no_password');
    expect(success).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should reset isAuthenticated on logout', async () => {
    const mockUser = { username: 'johndoe', email: 'john@example.com' };
    apiMock.post.mockResolvedValue({
      success: true,
      user: mockUser,
      session: { access_token: 'token123' },
    });

    await service.login('johndoe', '123');
    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should call sendOtp via backend', async () => {
    apiMock.post.mockResolvedValue({ success: true, isNewUser: true });
    const result = await service.sendOtp('new@example.com');
    expect(apiMock.post).toHaveBeenCalledWith('/auth/descope/send-otp', {
      email: 'new@example.com',
    });
    expect(result).toEqual({ success: true, isNewUser: true });
  });

  it('should return default on sendOtp failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    apiMock.post.mockRejectedValue(new Error('Send error'));
    const result = await service.sendOtp('new@example.com');
    expect(result).toEqual({ success: false, isNewUser: false });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should call verifyOtp and set session on success', async () => {
    const mockUser = { username: 'johndoe', email: 'john@example.com' };
    apiMock.post.mockResolvedValue({
      success: true,
      session: { access_token: 'token123' },
      user: mockUser,
    });
    const success = await service.verifyOtp('john@example.com', '123456');
    expect(apiMock.post).toHaveBeenCalledWith('/auth/descope/verify-otp', {
      email: 'john@example.com',
      code: '123456',
    });
    expect(success).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
  });

  it('should return false on verifyOtp failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    apiMock.post.mockRejectedValue(new Error('Verify error'));
    const success = await service.verifyOtp('john@example.com', '123456');
    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should call registerDescope and set session on success', async () => {
    const mockUser = { username: 'johndoe', email: 'john@example.com' };
    apiMock.post.mockResolvedValue({
      success: true,
      session: { access_token: 'token123' },
      user: mockUser,
    });
    const success = await service.registerDescope(
      'john@example.com',
      'token123',
      'John',
      'Doe',
      'johndoe',
    );
    expect(apiMock.post).toHaveBeenCalledWith('/auth/descope/register', {
      email: 'john@example.com',
      descopeToken: 'token123',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'johndoe',
    });
    expect(success).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
  });

  it('should return false on registerDescope failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    apiMock.post.mockRejectedValue(new Error('Register error'));
    const success = await service.registerDescope(
      'john@example.com',
      'token123',
      'John',
      'Doe',
      'johndoe',
    );
    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  describe('Auth Error Handling and Core Methods', () => {
    it('should return false when isEmailAvailable backend throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.get.mockRejectedValue(new Error('Network err'));
      const res = await service.isEmailAvailable('foo@bar.com');
      expect(res).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return false when isEmailAvailable is passed empty value', async () => {
      const res = await service.isEmailAvailable('  ');
      expect(res).toBe(false);
    });

    it('should return false when signUp backend throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValue(new Error('Signup err'));
      const res = await service.signUp({ username: 'x', email: 'e@e.com' });
      expect(res).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should start descope google oauth successfully', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.start.mockReturnValue(
        of({ ok: true, data: { url: 'https://google.com/oauth' } }),
      );
      const url = await service.startDescopeGoogleOAuth('http://localhost/login');
      expect(url).toBe('https://google.com/oauth');
      expect(fakeDescopeAuthService.descopeSdk.oauth.start).toHaveBeenCalledWith(
        'google',
        'http://localhost/login',
      );
    });

    it('should return null if start descope google oauth fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      fakeDescopeAuthService.descopeSdk.oauth.start.mockReturnValue(
        of({ ok: false, error: { errorDescription: 'Err' } }),
      );
      const url = await service.startDescopeGoogleOAuth('http://localhost/login');
      expect(url).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should exchange descope oauth code successfully and bridge session for existing user', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            sessionJwt: 'descope-jwt',
            user: { email: 'existing@e.com' },
          },
        }),
      );

      apiMock.post.mockResolvedValue({
        success: true,
        isNewUser: false,
        session: { access_token: 'supabase-token' },
        user: { email: 'existing@e.com' },
      });

      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(true);
      expect(apiMock.post).toHaveBeenCalledWith('/auth/descope/verify-oauth', {
        email: 'existing@e.com',
        descopeToken: 'descope-jwt',
      });
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isNewUserFlag()).toBe(false);
    });

    it('should exchange descope oauth code and set isNewUserFlag: true for new user', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            sessionJwt: 'descope-jwt',
            user: { email: 'new@e.com' },
          },
        }),
      );

      apiMock.post.mockResolvedValue({
        success: true,
        isNewUser: true,
        descopeToken: 'descope-jwt',
      });

      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(true);
      expect(service.isNewUserFlag()).toBe(true);
      expect(service.descopeToken()).toBe('descope-jwt');
      expect(service.descopeEmail()).toBe('new@e.com');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle exchange oauth failures and return false', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: false,
          error: { errorDescription: 'Invalid code' },
        }),
      );

      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Invalid code');
    });

    it('should return false if exchange returns no email address', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            sessionJwt: 'descope-jwt',
            user: { email: '' },
          },
        }),
      );

      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('No email address returned from Google account.');
    });

    it('should handle backend verification exception thrown by bridge', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            sessionJwt: 'descope-jwt',
            user: { email: 'e@e.com' },
          },
        }),
      );

      apiMock.post.mockRejectedValue(new Error('Bridge failure'));

      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should resolve immediate session if platform is NOT browser', async () => {
      // Redefine platform ID in a fresh setup if needed, or just cast mock it.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: ApiService, useValue: apiMock },
          { provide: DescopeAuthConfig, useValue: { projectId: 'test-project' } },
          { provide: DescopeAuthService, useValue: fakeDescopeAuthService },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const svc = TestBed.inject(AuthService);

      const promise = svc.waitForSessionInit();
      expect(promise).toBeTruthy();
      await expect(promise).resolves.toBeUndefined();
    });

    it('should perform checkSession and set session if api returns valid user', async () => {
      apiMock.get.mockResolvedValue({ user: { username: 'found_user' } });

      await service.checkSession();

      expect(apiMock.get).toHaveBeenCalledWith(expect.stringContaining('/auth/me'));
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.username).toBe('found_user');
    });

    it('should call checkSession once on waitForSessionInit and return the same promise on subsequent calls', async () => {
      const spy = vi.spyOn(service, 'checkSession').mockResolvedValue();

      const first = service.waitForSessionInit();
      const second = service.waitForSessionInit();

      expect(first).toBe(second);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should trigger logout if checkSession fails or user is empty', async () => {
      const logoutSpy = vi.spyOn(service, 'logout');

      apiMock.get.mockResolvedValue({}); // no user
      await service.checkSession();
      expect(logoutSpy).toHaveBeenCalled();

      logoutSpy.mockClear();
      apiMock.get.mockRejectedValue(new Error('Backend down'));
      await service.checkSession();
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('should avoid network calls on logout if not in browser mode', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: ApiService, useValue: apiMock },
          { provide: DescopeAuthConfig, useValue: { projectId: 'test-project' } },
          { provide: DescopeAuthService, useValue: fakeDescopeAuthService },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const svc = TestBed.inject(AuthService);
      apiMock.post.mockClear();

      svc.logout();
      expect(apiMock.post).not.toHaveBeenCalled();
    });

    it('should fail login if api call itself returns exception in login method', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValue(new Error('Crit error'));

      const res = await service.login('user', 'p');

      expect(res).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should call setSession on signUp success if session and user are present', async () => {
      const mockUser = { username: 'john', email: 'john@e.com' };
      apiMock.post.mockResolvedValue({
        success: true,
        session: { access_token: 't' },
        user: mockUser,
      });
      const res = await service.signUp(mockUser);
      expect(res).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
    });

    it('should return false when descopeAuth is not available for OAuth operations', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: ApiService, useValue: apiMock },
          { provide: DescopeAuthConfig, useValue: { projectId: 'test-project' } },
          { provide: DescopeAuthService, useValue: null },
        ],
      });
      const svc = TestBed.inject(AuthService);
      const url = await svc.startDescopeGoogleOAuth('http://localhost');
      expect(url).toBeNull();

      const res = await svc.exchangeDescopeOAuthCode('code');
      expect(res).toBe(false);
    });

    it('should handle sendOtp rejection with a non-Error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValue('Raw string network failure');
      const res = await service.sendOtp('test@test.com');
      expect(res.success).toBe(false);
      expect(service.authError()).toBe('Failed to send OTP');
      consoleSpy.mockRestore();
    });

    it('should handle verifyOtp resolving with success: false', async () => {
      apiMock.post.mockResolvedValue({ success: false });
      const res = await service.verifyOtp('test@test.com', '123456');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Invalid verification code.');
    });

    it('should handle verifyOtp rejection with a non-Error', async () => {
      apiMock.post.mockRejectedValue({ error: { error: 'Invalid token' } });
      const res = await service.verifyOtp('test@test.com', '123456');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Invalid token');
    });

    it('should handle registerDescope resolving with success: false', async () => {
      apiMock.post.mockResolvedValue({ success: false });
      const res = await service.registerDescope('e@e.com', 't', 'F', 'L', 'D');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Registration failed.');
    });

    it('should handle registerDescope rejection with a non-Error', async () => {
      apiMock.post.mockRejectedValue('Raw registration error');
      const res = await service.registerDescope('e@e.com', 't', 'F', 'L', 'D');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Registration failed');
    });

    it('should swallow errors when signout endpoint fails in logout', async () => {
      apiMock.post.mockRejectedValue(new Error('Signout failed'));
      expect(() => service.logout()).not.toThrow();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('should correctly report descope availability based on config', () => {
      expect(service.isDescopeAvailable()).toBe(true);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: ApiService, useValue: apiMock },
          { provide: DescopeAuthConfig, useValue: null },
          { provide: DescopeAuthService, useValue: null },
        ],
      });
      const svc = TestBed.inject(AuthService);
      expect(svc.isDescopeAvailable()).toBe(false);
    });

    it('should log error and return null if startDescopeGoogleOAuth throws an error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      fakeDescopeAuthService.descopeSdk.oauth.start.mockImplementation(() => {
        throw new Error('OAuth start crash');
      });
      const url = await service.startDescopeGoogleOAuth('http://localhost/login');
      expect(url).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should set authError and return false if handleAuthResponse returns false', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            sessionJwt: 'descope-jwt',
            user: { email: 'e@e.com' },
          },
        }),
      );

      apiMock.post.mockResolvedValue({
        success: false,
      });

      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('OAuth verification with backend failed.');
    });

    // Coverage Boosters: AuthService fallback and catch branches
    it('should return null in startDescopeGoogleOAuth when response ok but url is missing in data', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.start.mockReturnValue(
        of({ ok: true, data: { otherField: 'val' } }),
      );
      const url = await service.startDescopeGoogleOAuth('http://localhost/login');
      expect(url).toBeNull();
    });

    it('should fallback to default error message in exchangeDescopeOAuthCode when errorDescription is missing', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: false,
          error: {},
        }),
      );
      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Failed to exchange OAuth code.');
    });

    it('should fallback to empty descopeToken in exchangeDescopeOAuthCode when sessionJwt is missing', async () => {
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            user: { email: 'e@e.com' },
          },
        }),
      );
      apiMock.post.mockResolvedValue({ success: true, isNewUser: true });

      const res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(true);
      expect(apiMock.post).toHaveBeenCalledWith('/auth/descope/verify-oauth', {
        email: 'e@e.com',
        descopeToken: '',
      });
    });

    it('should fallback to generic error in exchangeDescopeOAuthCode when catch block receives empty object or non-object', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            sessionJwt: 't',
            user: { email: 'e@e.com' },
          },
        }),
      );
      // Reject with empty object
      apiMock.post.mockRejectedValueOnce({});
      let res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('OAuth verification failed');

      // Reject with non-object
      apiMock.post.mockRejectedValueOnce('raw string error');
      res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('OAuth verification failed');

      consoleSpy.mockRestore();
    });

    it('should fallback to generic error in sendOtp when catch block receives empty object', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValueOnce({});
      const res = await service.sendOtp('john@example.com');
      expect(res.success).toBe(false);
      expect(service.authError()).toBe('Failed to send OTP');
      consoleSpy.mockRestore();
    });

    it('should fallback to generic error in verifyOtp when catch block receives empty object or non-object', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValueOnce({});
      let res = await service.verifyOtp('john@example.com', '123456');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Verification failed');

      apiMock.post.mockRejectedValueOnce('string error');
      res = await service.verifyOtp('john@example.com', '123456');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Verification failed');
      consoleSpy.mockRestore();
    });

    it('should fallback to generic error in registerDescope when catch block receives empty object', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValueOnce({});
      const res = await service.registerDescope('e@e.com', 't', 'F', 'L', 'D');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Registration failed');
      consoleSpy.mockRestore();
    });

    it('should fallback to empty descopeToken in handleAuthResponse when resp.descopeToken is missing', async () => {
      apiMock.post.mockResolvedValue({
        success: true,
        isNewUser: true,
        // descopeToken is missing
      });
      const res = await service.verifyOtp('john@e.com', '123456');
      expect(res).toBe(true);
      expect(service.descopeToken()).toBe('');
    });

    it('should return false in handleAuthResponse when session is present but user is missing', async () => {
      apiMock.post.mockResolvedValue({
        success: true,
        isNewUser: false,
        session: { access_token: 'token' },
        // user is missing
      });
      const res = await service.verifyOtp('john@e.com', '123456');
      expect(res).toBe(false);
    });

    it('should return false in handleAuthResponse when session is missing but user is present', async () => {
      apiMock.post.mockResolvedValue({
        success: true,
        isNewUser: false,
        // session is missing
        user: { username: 'john', email: 'john@e.com' },
      });
      const res = await service.verifyOtp('john@e.com', '123456');
      expect(res).toBe(false);
    });

    it('should fallback to default error in sendOtp when catch block receives object with null or empty error field', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      // Case 1: { error: null }
      apiMock.post.mockRejectedValueOnce({ error: null });
      let res = await service.sendOtp('john@example.com');
      expect(res.success).toBe(false);
      expect(service.authError()).toBe('Failed to send OTP');

      // Case 2: { error: {} } (nested error is missing/empty)
      apiMock.post.mockRejectedValueOnce({ error: {} });
      res = await service.sendOtp('john@example.com');
      expect(res.success).toBe(false);
      expect(service.authError()).toBe('Failed to send OTP');
      consoleSpy.mockRestore();
    });

    it('should fallback to default error in verifyOtp when catch block receives object with null or empty error field', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      // Case 1: { error: null }
      apiMock.post.mockRejectedValueOnce({ error: null });
      let res = await service.verifyOtp('john@example.com', '123456');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Verification failed');

      // Case 2: { error: {} }
      apiMock.post.mockRejectedValueOnce({ error: {} });
      res = await service.verifyOtp('john@example.com', '123456');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Verification failed');
      consoleSpy.mockRestore();
    });

    it('should fallback to default error in registerDescope when catch block receives object with null or empty error field', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      // Case 1: { error: null }
      apiMock.post.mockRejectedValueOnce({ error: null });
      let res = await service.registerDescope('e@e.com', 't', 'F', 'L', 'D');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Registration failed');

      // Case 2: { error: {} }
      apiMock.post.mockRejectedValueOnce({ error: {} });
      res = await service.registerDescope('e@e.com', 't', 'F', 'L', 'D');
      expect(res).toBe(false);
      expect(service.authError()).toBe('Registration failed');
      consoleSpy.mockRestore();
    });

    it('should fallback to default error in exchangeDescopeOAuthCode when catch block receives object with null or empty error field', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      fakeDescopeAuthService.descopeSdk.oauth.exchange.mockReturnValue(
        of({
          ok: true,
          data: {
            sessionJwt: 't',
            user: { email: 'e@e.com' },
          },
        }),
      );
      // Case 1: { error: null }
      apiMock.post.mockRejectedValueOnce({ error: null });
      let res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('OAuth verification failed');

      // Case 2: { error: {} }
      apiMock.post.mockRejectedValueOnce({ error: {} });
      res = await service.exchangeDescopeOAuthCode('code123');
      expect(res).toBe(false);
      expect(service.authError()).toBe('OAuth verification failed');
      consoleSpy.mockRestore();
    });
  });
});
