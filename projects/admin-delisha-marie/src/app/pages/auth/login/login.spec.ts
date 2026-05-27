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
  authError: unknown;
  descopeToken: unknown;
  isNewUserFlag: unknown;
  login: Mock;
  isUsernameAvailable: Mock;
  isEmailAvailable: Mock;
  signUp: Mock;
  loginBiosignature: Mock;
  retrieveUsername: Mock;
  retrievePassword: Mock;
  checkSession: Mock;
  waitForSessionInit: Mock;
  sendOtp: Mock;
  verifyOtp: Mock;
  registerDescope: Mock;
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
  const fakeAuthError = signal<string | null>(null);
  const fakeDescopeToken = signal<string>('mock_descope_token');
  const fakeIsNewUserFlag = signal<boolean>(false);

  beforeEach(async () => {
    TestBed.resetTestingModule();
    loginReturnValue = true;
    fakeIsAuthenticated.set(false);
    fakeCurrentUser.set(null);
    fakeAuthError.set(null);
    fakeDescopeToken.set('mock_descope_token');
    fakeIsNewUserFlag.set(false);
    queryParams = {};

    fakeSnackBar = { open: vi.fn() };
    fakeAuthService = {
      isAuthenticated: fakeIsAuthenticated,
      currentUser: fakeCurrentUser,
      authError: fakeAuthError,
      descopeToken: fakeDescopeToken,
      isNewUserFlag: fakeIsNewUserFlag,
      login: vi.fn().mockImplementation(async (u: string) => {
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
      sendOtp: vi.fn().mockResolvedValue({ success: true, isNewUser: false }),
      verifyOtp: vi.fn().mockResolvedValue(true),
      registerDescope: vi.fn().mockResolvedValue(true),
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
    expect(component['common'].brandTitle).toBe('Test Brand');
  });

  it('should start with step1Form invalid when empty', () => {
    expect(component['step1Form']().valid()).toBeFalsy();
  });

  it('should succeed sending OTP and transition to step 2 (existing user)', async () => {
    fakeAuthService.sendOtp.mockResolvedValue({ success: true, isNewUser: false });
    component['step1Model'].set({ email: 'test@example.com' });
    expect(component['step1Form']().valid()).toBeTruthy();

    await submit(component['step1Form']);

    expect(fakeAuthService.sendOtp).toHaveBeenCalledWith('test@example.com');
    expect(component['currentStep']()).toBe('otp');
    expect(component['isNewUser']()).toBe(false);
    expect(component['userEmail']()).toBe('test@example.com');
  });

  it('should succeed sending OTP and transition to step 2 (new user)', async () => {
    fakeAuthService.sendOtp.mockResolvedValue({ success: true, isNewUser: true });
    component['step1Model'].set({ email: 'new@example.com' });
    expect(component['step1Form']().valid()).toBeTruthy();

    await submit(component['step1Form']);

    expect(fakeAuthService.sendOtp).toHaveBeenCalledWith('new@example.com');
    expect(component['currentStep']()).toBe('otp');
    expect(component['isNewUser']()).toBe(true);
    expect(component['userEmail']()).toBe('new@example.com');
  });

  it('should show snackbar message when sending OTP fails', async () => {
    fakeAuthService.sendOtp.mockResolvedValue({ success: false, isNewUser: false });
    component['step1Model'].set({ email: 'error@example.com' });

    await submit(component['step1Form']);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to send OTP. Please try again.',
      'Close',
      expect.any(Object),
    );
    expect(component['currentStep']()).toBe('email');
  });

  it('should verify OTP and redirect on success for existing user', async () => {
    component['userEmail'].set('john@example.com');
    component['isNewUser'].set(false);
    component['currentStep'].set('otp');
    component['step2Model'].set({ code: '123456' });

    fakeAuthService.verifyOtp.mockResolvedValue(true);

    await submit(component['step2Form']);

    expect(fakeAuthService.verifyOtp).toHaveBeenCalledWith('john@example.com', '123456');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Successfully logged in!',
      'Close',
      expect.any(Object),
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should show snackbar message when OTP verification fails for existing user', async () => {
    component['userEmail'].set('john@example.com');
    component['isNewUser'].set(false);
    component['currentStep'].set('otp');
    component['step2Model'].set({ code: '123456' });

    fakeAuthService.verifyOtp.mockResolvedValue(false);

    await submit(component['step2Form']);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Invalid verification code. Please try again.',
      'Close',
      expect.any(Object),
    );
  });

  it('should verify OTP and transition to step 3 for new user when code is submitted', async () => {
    component['userEmail'].set('new@example.com');
    component['currentStep'].set('otp');
    component['step2Model'].set({ code: '123456' });

    fakeAuthService.verifyOtp.mockResolvedValue(true);
    fakeIsNewUserFlag.set(true);

    await submit(component['step2Form']);

    expect(fakeAuthService.verifyOtp).toHaveBeenCalledWith('new@example.com', '123456');
    expect(component['currentStep']()).toBe('info');
  });

  it('should complete registration and redirect on successful step 3 submission', async () => {
    component['userEmail'].set('new@example.com');
    component['otpCode'].set('123456');
    component['isNewUser'].set(true);
    component['currentStep'].set('info');

    component['step3Model'].set({
      firstName: 'Alice',
      lastName: 'Wonder',
      displayName: 'alicew',
    });

    fakeAuthService.registerDescope.mockResolvedValue(true);

    await submit(component['step3Form']);

    expect(fakeAuthService.registerDescope).toHaveBeenCalledWith(
      'new@example.com',
      'mock_descope_token',
      'Alice',
      'Wonder',
      'alicew',
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      'Profile created and logged in successfully!',
      'Close',
      expect.any(Object),
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should show error when registration fails', async () => {
    component['userEmail'].set('new@example.com');
    component['otpCode'].set('123456');
    component['isNewUser'].set(true);
    component['currentStep'].set('info');

    component['step3Model'].set({
      firstName: 'Alice',
      lastName: 'Wonder',
      displayName: 'alicew',
    });

    fakeAuthService.registerDescope.mockResolvedValue(false);

    await submit(component['step3Form']);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Registration failed. Please try again.',
      'Close',
      expect.any(Object),
    );
  });

  it('should resend OTP code successfully', async () => {
    component['userEmail'].set('john@example.com');
    component['currentStep'].set('otp');
    component['step2Model'].set({ code: '123456' });

    fakeAuthService.sendOtp.mockResolvedValue({ success: true, isNewUser: false });

    await component['resendOtp']();

    expect(fakeAuthService.sendOtp).toHaveBeenCalledWith('john@example.com');
    expect(component['step2Model']().code).toBe('');
    expect(snackBar.open).toHaveBeenCalledWith(
      'A new OTP has been sent successfully to john@example.com',
      'Close',
      expect.any(Object),
    );
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

  it('should redirect to custom returnUrl on successful form login (OTP)', async () => {
    queryParams = { returnUrl: '/recipes' };
    component['userEmail'].set('john@example.com');
    component['isNewUser'].set(false);
    component['currentStep'].set('otp');
    component['step2Model'].set({ code: '123456' });

    fakeAuthService.verifyOtp.mockResolvedValue(true);

    await submit(component['step2Form']);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes');
  });

  it('should redirect to custom returnUrl on social auth state changes', () => {
    queryParams = { returnUrl: '/recipes' };
    const mockUser = { name: 'Test User', email: 'test@example.com' } as SocialUser;
    authStateSubject.next(mockUser);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes');
  });
});
