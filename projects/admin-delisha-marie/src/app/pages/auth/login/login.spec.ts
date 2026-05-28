import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRoute } from '@angular/router';
import { vi, Mock } from 'vitest';
import { LoginComponent } from './login';
import { BRAND_TITLE_TOKEN } from '../auth-shared.utils';
import { AuthService } from '../../../services/auth.service';
import { submit } from '@angular/forms/signals';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';

interface MockAuthService {
  isAuthenticated: unknown;
  currentUser: unknown;
  authError: unknown;
  descopeToken: unknown;
  descopeEmail: unknown;
  isNewUserFlag: unknown;
  isDescopeAvailable: unknown;
  login: Mock;
  isUsernameAvailable: Mock;
  isEmailAvailable: Mock;
  signUp: Mock;
  loginBiosignature: Mock;

  checkSession: Mock;
  waitForSessionInit: Mock;
  sendOtp: Mock;
  verifyOtp: Mock;
  registerDescope: Mock;
  startDescopeGoogleOAuth: Mock;
  exchangeDescopeOAuthCode: Mock;
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let snackBar: MatSnackBar;

  let loginReturnValue = true;

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

  const fakeIsAuthenticated = signal(false);
  const fakeCurrentUser = signal<unknown>(null);
  const fakeAuthError = signal<string | null>(null);
  const fakeDescopeToken = signal<string>('mock_descope_token');
  const fakeDescopeEmail = signal<string>('google-new-user@example.com');
  const fakeIsNewUserFlag = signal<boolean>(false);

  beforeEach(async () => {
    TestBed.resetTestingModule();
    loginReturnValue = true;
    fakeIsAuthenticated.set(false);
    fakeCurrentUser.set(null);
    fakeAuthError.set(null);
    fakeDescopeToken.set('mock_descope_token');
    fakeDescopeEmail.set('google-new-user@example.com');
    fakeIsNewUserFlag.set(false);
    queryParams = {};

    fakeSnackBar = { open: vi.fn() };
    fakeAuthService = {
      isAuthenticated: fakeIsAuthenticated,
      currentUser: fakeCurrentUser,
      authError: fakeAuthError,
      descopeToken: fakeDescopeToken,
      descopeEmail: fakeDescopeEmail,
      isNewUserFlag: fakeIsNewUserFlag,
      isDescopeAvailable: signal(true),
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

      checkSession: vi.fn().mockImplementation(async () => {
        fakeIsAuthenticated.set(true);
        fakeCurrentUser.set({ username: 'sirda', email: 'sirda@example.com' });
      }),
      waitForSessionInit: vi.fn().mockResolvedValue(undefined),
      sendOtp: vi.fn().mockResolvedValue({ success: true, isNewUser: false }),
      verifyOtp: vi.fn().mockResolvedValue(true),
      registerDescope: vi.fn().mockResolvedValue(true),
      startDescopeGoogleOAuth: vi.fn(),
      exchangeDescopeOAuthCode: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: AuthService, useValue: fakeAuthService },
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

  it('should call startDescopeGoogleOAuth and redirect when clicking Google Sign-in button', async () => {
    const startSpy = vi
      .mocked(fakeAuthService.startDescopeGoogleOAuth)
      .mockResolvedValue('https://google.com/oauth-start');

    const assignMock = vi.fn();
    vi.stubGlobal('location', {
      assign: assignMock,
      origin: 'http://localhost',
    });

    await component['loginWithDescopeGoogle']();

    expect(startSpy).toHaveBeenCalled();
    expect(assignMock).toHaveBeenCalledWith('https://google.com/oauth-start');

    vi.unstubAllGlobals();
  });

  it('should show snackbar error if starting Google OAuth fails', async () => {
    vi.mocked(fakeAuthService.startDescopeGoogleOAuth).mockResolvedValue(null);

    await component['loginWithDescopeGoogle']();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to start Google sign in. Please try again.',
      'Close',
      { duration: 5000 },
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

  it('should handle exchange code query parameter successfully for existing user', async () => {
    vi.mocked(fakeAuthService.waitForSessionInit).mockResolvedValue(undefined);
    fakeIsAuthenticated.set(false);
    queryParams = { code: 'code123' };
    vi.mocked(fakeAuthService.exchangeDescopeOAuthCode).mockResolvedValue(true);
    fakeIsNewUserFlag.set(false);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(fakeAuthService.exchangeDescopeOAuthCode).toHaveBeenCalledWith('code123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should handle exchange code query parameter successfully for new user', async () => {
    vi.mocked(fakeAuthService.waitForSessionInit).mockResolvedValue(undefined);
    fakeIsAuthenticated.set(false);
    queryParams = { code: 'code123' };
    vi.mocked(fakeAuthService.exchangeDescopeOAuthCode).mockResolvedValue(true);
    fakeIsNewUserFlag.set(true);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(component['currentStep']()).toBe('info');
    expect(component['userEmail']()).toBe('google-new-user@example.com');
  });

  it('should show snackbar error if exchange fails', async () => {
    vi.mocked(fakeAuthService.waitForSessionInit).mockResolvedValue(undefined);
    fakeIsAuthenticated.set(false);
    queryParams = { code: 'code123' };
    vi.mocked(fakeAuthService.exchangeDescopeOAuthCode).mockResolvedValue(false);
    fakeAuthError.set('OAuth failed');

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(snackBar.open).toHaveBeenCalledWith('OAuth failed', 'Close', { duration: 5000 });
  });
});
