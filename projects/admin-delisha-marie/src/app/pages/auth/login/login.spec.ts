import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRoute } from '@angular/router';
import { vi, Mock } from 'vitest';
import { LoginComponent } from './login';
import { BRAND_TITLE_TOKEN } from '../auth-shared.utils';
import { AuthService } from '../../../services/auth.service';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { submit } from '@angular/forms/signals';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';

interface MockAuthService {
  isAuthenticated: unknown;
  currentUser: unknown;
  login: Mock;
  isUsernameAvailable: Mock;
  isEmailAvailable: Mock;
  signUp: Mock;
  loginBiosignature: Mock;
  retrieveUsername: Mock;
  retrievePassword: Mock;
  checkSession: Mock;
  waitForSessionInit: Mock;
}

interface MockSocialAuthService {
  authState: Subject<SocialUser>;
  initState: Subject<boolean>;
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let snackBar: MatSnackBar;

  let loginReturnValue = true;
  let loginParams: [string, string] | null = null;
  const authStateSubject = new Subject<SocialUser>();

  let queryParams: Record<string, string> = {};
  const fakeActivatedRoute = {
    snapshot: {
      get queryParams() {
        return queryParams;
      },
    },
  };

  if (typeof navigator !== 'undefined' && !navigator.credentials) {
    Object.defineProperty(navigator, 'credentials', {
      value: {
        get: vi.fn(),
        create: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  }

  let fakeSnackBar: { open: Mock };
  let fakeAuthService: MockAuthService;
  let fakeSocialAuthService: MockSocialAuthService;

  const fakeIsAuthenticated = signal(false);
  const fakeCurrentUser = signal<unknown>(null);

  beforeEach(async () => {
    TestBed.resetTestingModule();
    loginReturnValue = true;
    loginParams = null;
    fakeIsAuthenticated.set(false);
    fakeCurrentUser.set(null);
    queryParams = {};

    fakeSnackBar = { open: vi.fn() };
    fakeAuthService = {
      isAuthenticated: fakeIsAuthenticated,
      currentUser: fakeCurrentUser,
      login: vi.fn().mockImplementation(async (u: string, p: string) => {
        loginParams = [u, p];
        if (loginReturnValue) {
          fakeIsAuthenticated.set(true);
          fakeCurrentUser.set({ username: u, email: 'john@example.com' });
        }
        return loginReturnValue;
      }),
      isUsernameAvailable: vi.fn().mockResolvedValue(true),
      isEmailAvailable: vi.fn().mockResolvedValue(true),
      signUp: vi.fn().mockResolvedValue(true),
      loginBiosignature: vi.fn().mockImplementation(() => {
        fakeIsAuthenticated.set(true);
        fakeCurrentUser.set({ username: 'sirda', email: 'sirda@example.com' });
        return true;
      }),
      retrieveUsername: vi
        .fn()
        .mockImplementation(async (email: string) => (email === 'test@test.com' ? 'sirda' : null)),
      retrievePassword: vi
        .fn()
        .mockImplementation(async (user: string) => (user === 'sirda' ? 'Password123!' : null)),
      checkSession: vi.fn().mockImplementation(async () => {
        fakeIsAuthenticated.set(true);
        fakeCurrentUser.set({ username: 'sirda', email: 'sirda@example.com' });
      }),
      waitForSessionInit: vi.fn().mockResolvedValue(undefined),
    };
    fakeSocialAuthService = {
      authState: authStateSubject,
      initState: new Subject<boolean>(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: AuthService, useValue: fakeAuthService },
        { provide: SocialAuthService, useValue: fakeSocialAuthService },
        { provide: BRAND_TITLE_TOKEN, useValue: 'Test Brand' },
        { provide: MatSnackBar, useValue: fakeSnackBar },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: fakeSnackBar })
      .compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    vi.spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
    // Using bracket notation to access protected member for testing
    expect(component['common'].brandTitle).toBe('Test Brand');
  });

  it('should start with login form invalid when empty', () => {
    expect(component['loginForm']().valid()).toBeFalsy();
  });

  it('should succeed login and navigate on valid form submission', async () => {
    loginReturnValue = true;
    component['loginModel'].set({ username: 'johndoe', password: 'Password123!' });
    expect(component['loginForm']().valid()).toBeTruthy();

    await submit(component['loginForm']);

    expect(loginParams).toEqual(['johndoe', 'Password123!']);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should fail login and display error message on invalid credentials', async () => {
    loginReturnValue = false;
    component['loginModel'].set({ username: 'johndoe', password: 'Password123!' });
    expect(component['loginForm']().valid()).toBeTruthy();

    await submit(component['loginForm']);

    expect(loginParams).toEqual(['johndoe', 'Password123!']);
    expect(snackBar.open).toHaveBeenCalledWith('Invalid username or password.', 'Close', {
      duration: 10000,
    });
  });

  it('should handle forgot username success', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('test@test.com');
    await component['onForgotUsername']();
    expect(snackBar.open).toHaveBeenCalledWith('Your username is: sirda', 'Close', {
      duration: 10000,
    });
  });

  it('should handle forgot username failure', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('unknown@test.com');
    await component['onForgotUsername']();
    expect(snackBar.open).toHaveBeenCalledWith('Email address not found.', 'Close', {
      duration: 10000,
    });
  });

  it('should handle forgot username cancellation', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    await component['onForgotUsername']();
    expect(fakeAuthService.retrieveUsername).not.toHaveBeenCalled();
  });

  it('should handle forgot password success', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('sirda');
    await component['onForgotPassword']();
    expect(snackBar.open).toHaveBeenCalledWith('Your password is: Password123!', 'Close', {
      duration: 10000,
    });
  });

  it('should handle forgot password failure', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('unknown');
    await component['onForgotPassword']();
    expect(snackBar.open).toHaveBeenCalledWith('Username not found.', 'Close', { duration: 10000 });
  });

  it('should handle forgot password cancellation', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    await component['onForgotPassword']();
    expect(fakeAuthService.retrievePassword).not.toHaveBeenCalled();
  });

  it('should handle social auth state changes', () => {
    const mockUser = { name: 'Test User', email: 'test@example.com' } as SocialUser;
    authStateSubject.next(mockUser);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Successfully authenticated as Test User! Redirecting...',
      'Close',
      { duration: 10000 },
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should handle social auth state changes with null user', () => {
    authStateSubject.next(null as unknown as SocialUser);
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should authenticate with passkey when PublicKeyCredential exists', async () => {
    vi.useFakeTimers();
    const win = window as unknown as Record<string, unknown>;
    win['PublicKeyCredential'] = true;
    const getSpy = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, 'credentials', {
      value: { get: getSpy },
      configurable: true,
      writable: true,
    });

    void component['authenticateWithPasskey']();

    await Promise.resolve();
    await Promise.resolve();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Passkey authenticated successfully! Logging you in...',
      'Close',
      { duration: 10000 },
    );

    vi.advanceTimersByTime(1000);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    vi.useRealTimers();
  });

  it('should handle passkey authentication returning null', async () => {
    const win = window as unknown as Record<string, unknown>;
    win['PublicKeyCredential'] = true;
    const getSpy = vi.fn().mockResolvedValue(null);
    Object.defineProperty(navigator, 'credentials', {
      value: { get: getSpy },
      configurable: true,
      writable: true,
    });

    await component['authenticateWithPasskey']();
    expect(snackBar.open).not.toHaveBeenCalledWith(
      'Passkey authenticated successfully! Logging you in...',
      'Close',
      expect.anything(),
    );
  });

  it('should fail passkey authentication if it throws an error', async () => {
    const win = window as unknown as Record<string, unknown>;
    win['PublicKeyCredential'] = true;
    const getSpy = vi.fn().mockRejectedValue(new Error('Cancelled'));
    Object.defineProperty(navigator, 'credentials', {
      value: { get: getSpy },
      configurable: true,
      writable: true,
    });

    await component['authenticateWithPasskey']();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Passkey authentication failed or was cancelled.',
      'Close',
      { duration: 10000 },
    );
  });

  it('should immediately navigate if already authenticated upon init', async () => {
    fakeIsAuthenticated.set(true);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: fakeAuthService },
        { provide: SocialAuthService, useValue: fakeSocialAuthService },
        { provide: BRAND_TITLE_TOKEN, useValue: 'Test Brand' },
        { provide: MatSnackBar, useValue: fakeSnackBar },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: fakeSnackBar })
      .compileComponents();

    const r = TestBed.inject(Router);
    vi.spyOn(r, 'navigate');
    vi.spyOn(r, 'navigateByUrl');

    const fix = TestBed.createComponent(LoginComponent);
    fix.detectChanges();
    await fix.whenStable();

    expect(r.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should redirect to custom returnUrl on successful form login', async () => {
    queryParams = { returnUrl: '/recipes' };
    loginReturnValue = true;
    component['loginModel'].set({ username: 'johndoe', password: 'Password123!' });
    expect(component['loginForm']().valid()).toBeTruthy();

    await submit(component['loginForm']);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes');
  });

  it('should redirect to custom returnUrl on social auth state changes', () => {
    queryParams = { returnUrl: '/recipes' };
    const mockUser = { name: 'Test User', email: 'test@example.com' } as SocialUser;
    authStateSubject.next(mockUser);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes');
  });
});
