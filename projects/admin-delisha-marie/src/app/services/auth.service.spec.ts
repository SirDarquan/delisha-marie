import { TestBed } from '@angular/core/testing';
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
});
