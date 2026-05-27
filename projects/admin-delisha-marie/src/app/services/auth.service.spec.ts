import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  const authStateSubject = new Subject<SocialUser>();
  const fakeSocialAuthService = {
    authState: authStateSubject.asObservable(),
    signOut: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    apiMock = {
      get: vi.fn().mockResolvedValue({}),
      post: vi.fn().mockResolvedValue({}),
      put: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiMock },
        { provide: SocialAuthService, useValue: fakeSocialAuthService },
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

  it('should retrieve password via backend', async () => {
    apiMock.post.mockResolvedValue({ password: 'secret_password' });
    const pw = await service.retrievePassword('sirda');
    expect(apiMock.post).toHaveBeenCalledWith('/auth/retrieve-password', {
      identifier: 'sirda',
    });
    expect(pw).toBe('secret_password');
  });

  it('should retrieve username via backend', async () => {
    apiMock.post.mockResolvedValue({ username: 'sirda' });
    const user = await service.retrieveUsername('sirda@example.com');
    expect(apiMock.post).toHaveBeenCalledWith('/auth/retrieve-username', {
      email: 'sirda@example.com',
    });
    expect(user).toBe('sirda');
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

    it('should login with social user successfully', async () => {
      const user = { idToken: 'tok123', provider: 'GOOGLE', name: 'Social User' } as SocialUser;
      apiMock.post.mockResolvedValue({
        success: true,
        session: { access_token: 'sestok' },
        user: { username: 'social', email: 's@s.com' },
      });
      const res = await service.loginWithSocial(user);
      expect(res).toBe(true);
      expect(apiMock.post).toHaveBeenCalledWith('/auth/social-login', {
        token: 'tok123',
        provider: 'google',
      });
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false if social login explicitly reports failure', async () => {
      apiMock.post.mockResolvedValue({ success: false });
      const res = await service.loginWithSocial({ idToken: 'x' } as SocialUser);
      expect(res).toBe(false);
    });

    it('should handle social login exception thrown by backend', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValue(new Error('Failure'));
      const res = await service.loginWithSocial({ idToken: 'x' } as SocialUser);
      expect(res).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return null if retrievePassword fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValue(new Error('Pass err'));
      const res = await service.retrievePassword('x');
      expect(res).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return null if retrieveUsername fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValue(new Error('User err'));
      const res = await service.retrieveUsername('x');
      expect(res).toBeNull();
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
          { provide: SocialAuthService, useValue: fakeSocialAuthService },
          { provide: 'PLATFORM_ID', useValue: 'server' },
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
          { provide: SocialAuthService, useValue: fakeSocialAuthService },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const svc = TestBed.inject(AuthService);
      apiMock.post.mockClear();

      svc.logout();
      expect(apiMock.post).not.toHaveBeenCalled();
    });

    it('should login via subscription when socialAuth emits a user', async () => {
      const loginSpy = vi.spyOn(service, 'loginWithSocial').mockResolvedValue(true);
      const mockSocial = { idToken: 'xyz' } as SocialUser;

      authStateSubject.next(mockSocial);

      // Wait for next cycle because the subscription has `async` callback
      await Promise.resolve();

      expect(loginSpy).toHaveBeenCalledWith(mockSocial);
    });

    it('should fail login if api call itself returns exception in login method', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiMock.post.mockRejectedValue(new Error('Crit error'));

      const res = await service.login('user', 'p');

      expect(res).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
