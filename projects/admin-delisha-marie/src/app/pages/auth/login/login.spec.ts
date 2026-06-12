import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Mock, vi } from 'vitest';
import { AuthService } from '../../../services/auth.service';
import { BRAND_TITLE_TOKEN } from '../auth-shared.utils';
import { LoginComponent } from './login';

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
  let assignMock: Mock<(url: string) => void>;

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
    assignMock = vi.fn<(url: string) => void>();

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
        {
          provide: DOCUMENT,
          useFactory: () => {
            return new Proxy(globalThis.document, {
              get(target, prop) {
                if (prop === 'location') {
                  return {
                    origin: 'http://localhost',
                    assign: (url: string) => assignMock(url),
                  };
                }
                const val = Reflect.get(target, prop);
                if (typeof val === 'function') {
                  return val.bind(target);
                }
                return val;
              },
            });
          },
        },
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
    fixture.detectChanges();
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
    fixture.detectChanges();
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
    fixture.detectChanges();
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
    fixture.detectChanges();

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
    fixture.detectChanges();

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
    fixture.detectChanges();
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

    await component['loginWithDescopeGoogle']();

    expect(startSpy).toHaveBeenCalled();
    expect(assignMock).toHaveBeenCalledWith('https://google.com/oauth-start');
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
    fixture.detectChanges();
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

  // Coverage Boosters: Constructor flow with 'code' param during component creation
  it('should initialize exchangingOAuth and isGoogleLogin in constructor when code param is present', async () => {
    TestBed.resetTestingModule();
    queryParams = { code: 'oauth-code' };

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

    const fix = TestBed.createComponent(LoginComponent);
    const comp = fix.componentInstance;
    expect(comp['exchangingOAuth']()).toBe(true);
    expect(comp['isGoogleLogin']()).toBe(true);
    fix.detectChanges();
  });

  // Coverage Boosters: Catch blocks for Step 1
  it('should handle exceptions during OTP send', async () => {
    fakeAuthService.sendOtp.mockRejectedValue(new Error('Send OTP connection error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    component['step1Model'].set({ email: 'test@example.com' });
    await submit(component['step1Form']);

    expect(snackBar.open).toHaveBeenCalledWith('An error occurred. Please try again.', 'Close', {
      duration: 5000,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // Coverage Boosters: Catch blocks for Step 2
  it('should handle exceptions during OTP verification', async () => {
    component['userEmail'].set('john@example.com');
    component['currentStep'].set('otp');
    fixture.detectChanges();
    component['step2Model'].set({ code: '123456' });

    fakeAuthService.verifyOtp.mockRejectedValue(new Error('Verify OTP timeout error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await submit(component['step2Form']);

    expect(snackBar.open).toHaveBeenCalledWith('Verification failed. Please try again.', 'Close', {
      duration: 5000,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // Coverage Boosters: Catch blocks and OAuth failures for exchangeDescopeOAuthCode
  it('should handle exceptions inside ngOnInit code exchange', async () => {
    vi.mocked(fakeAuthService.waitForSessionInit).mockResolvedValue(undefined);
    fakeIsAuthenticated.set(false);
    queryParams = { code: 'code123' };
    vi.mocked(fakeAuthService.exchangeDescopeOAuthCode).mockRejectedValue(
      new Error('Network error'),
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(snackBar.open).toHaveBeenCalledWith(
      'An error occurred during Google sign in.',
      'Close',
      { duration: 5000 },
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component['isGoogleLogin']()).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  // Coverage Boosters: Step 3 Session Expiration branches for Google OAuth login
  it('should redirect Google login flow to email screen on registration session expiration', async () => {
    vi.useFakeTimers();
    component['userEmail'].set('expired-google@example.com');
    component['isNewUser'].set(true);
    component['currentStep'].set('info');
    component['isGoogleLogin'].set(true);
    fixture.detectChanges();

    component['step3Model'].set({
      firstName: 'Alice',
      lastName: 'Wonder',
      displayName: 'alicew',
    });

    fakeAuthService.registerDescope.mockResolvedValue(false);
    fakeAuthError.set('Descope token expired');

    await submit(component['step3Form']);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Session has expired or is invalid. Redirecting to Google Login...',
      'Close',
      { duration: 7000 },
    );

    vi.advanceTimersByTime(1000);
    expect(component['currentStep']()).toBe('email');
    vi.useRealTimers();
  });

  // Coverage Boosters: Step 3 Session Expiration branches for Normal Email OTP login
  it('should redirect Email OTP flow to otp screen on registration session expiration', async () => {
    vi.useFakeTimers();
    component['userEmail'].set('expired-otp@example.com');
    component['isNewUser'].set(true);
    component['currentStep'].set('info');
    component['isGoogleLogin'].set(false);
    fixture.detectChanges();

    component['step3Model'].set({
      firstName: 'Bob',
      lastName: 'Builder',
      displayName: 'bob',
    });

    fakeAuthService.registerDescope.mockResolvedValue(false);
    fakeAuthError.set('Descope code expired');

    await submit(component['step3Form']);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Session has expired or is invalid. Redirecting to verify your OTP again...',
      'Close',
      { duration: 7000 },
    );

    expect(component['step2Model']().code).toBe('');

    vi.advanceTimersByTime(1000);
    expect(component['currentStep']()).toBe('otp');
    vi.useRealTimers();
  });

  // Coverage Boosters: Catch blocks for Step 3
  it('should handle registration exceptions during step 3 submit', async () => {
    component['userEmail'].set('new@example.com');
    component['currentStep'].set('info');
    fixture.detectChanges();

    component['step3Model'].set({
      firstName: 'Alice',
      lastName: 'Wonder',
      displayName: 'alicew',
    });

    fakeAuthService.registerDescope.mockRejectedValue(new Error('Db constraint error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await submit(component['step3Form']);

    expect(snackBar.open).toHaveBeenCalledWith(
      'An error occurred during registration. Please try again.',
      'Close',
      { duration: 5000 },
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // Coverage Boosters: resendOtp failures
  it('should do nothing in resendOtp if userEmail is empty', async () => {
    component['userEmail'].set('');
    component['currentStep'].set('otp');
    fixture.detectChanges();

    await component['resendOtp']();
    expect(fakeAuthService.sendOtp).not.toHaveBeenCalled();
  });

  it('should show error in resendOtp when sending fails', async () => {
    component['userEmail'].set('john@example.com');
    component['currentStep'].set('otp');
    fixture.detectChanges();

    fakeAuthService.sendOtp.mockResolvedValue({ success: false, isNewUser: false });
    fakeAuthError.set('Resend limit reached');

    await component['resendOtp']();

    expect(snackBar.open).toHaveBeenCalledWith('Resend limit reached', 'Close', { duration: 5000 });
  });

  it('should handle exceptions during resendOtp', async () => {
    component['userEmail'].set('john@example.com');
    component['currentStep'].set('otp');
    fixture.detectChanges();

    fakeAuthService.sendOtp.mockRejectedValue(new Error('Network disconnected'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await component['resendOtp']();

    expect(snackBar.open).toHaveBeenCalledWith('Error sending new OTP.', 'Close', {
      duration: 5000,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // Coverage Boosters: Back Button layout navigations
  it('should compute backButtonLabel reactively based on isGoogleLogin', () => {
    component['isGoogleLogin'].set(true);
    expect(component['backButtonLabel']()).toBe('← Back to Login');

    component['isGoogleLogin'].set(false);
    expect(component['backButtonLabel']()).toBe('← Back to Verification Code');
  });

  it('should transition correctly in goBackFromProfile', () => {
    component['isGoogleLogin'].set(true);
    component['goBackFromProfile']();
    expect(component['currentStep']()).toBe('email');

    component['isGoogleLogin'].set(false);
    component['goBackFromProfile']();
    expect(component['currentStep']()).toBe('otp');
  });

  it('should transition correctly in goBackToEmail', () => {
    component['currentStep'].set('otp');
    component['goBackToEmail']();
    expect(component['currentStep']()).toBe('email');
  });

  // Coverage Boosters: additional inline template rendering and validation checks
  it('should render authenticating loader when exchangingOAuth is true', () => {
    component['exchangingOAuth'].set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
    expect(compiled.textContent).toContain('Authenticating...');
  });

  it('should show error when email is touched and invalid', () => {
    component['step1Form'].email().markAsTouched();
    component['step1Model'].set({ email: 'invalid-email' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Please enter a valid email address.');
  });

  it('should show error when verification code is touched and invalid', () => {
    component['currentStep'].set('otp');
    component['step2Form'].code().markAsTouched();
    component['step2Model'].set({ code: '123' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Enter a valid 6-digit verification code.');
  });

  it('should show profile validation errors when inputs are touched and invalid', () => {
    component['currentStep'].set('info');
    component['step3Form'].firstName().markAsTouched();
    component['step3Form'].lastName().markAsTouched();
    component['step3Form'].displayName().markAsTouched();
    component['step3Model'].set({ firstName: '', lastName: '', displayName: '' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('First name is required.');
    expect(compiled.textContent).toContain('Last name is required.');
    expect(compiled.textContent).toContain('Display name is required.');
  });

  it('should show sending code loader when submittingStep1 is true', () => {
    component['submittingStep1'].set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Sending Code...');
  });

  it('should show verifying loader when submittingStep2 is true', () => {
    component['currentStep'].set('otp');
    component['submittingStep2'].set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Verifying...');
  });

  it('should show completing registration loader when submittingStep3 is true', () => {
    component['currentStep'].set('info');
    component['submittingStep3'].set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Completing Registration...');
  });

  it('should trigger loginWithDescopeGoogle when google sign-in button is clicked', () => {
    const spy = vi
      .spyOn(
        component as unknown as { loginWithDescopeGoogle: () => Promise<unknown> },
        'loginWithDescopeGoogle',
      )
      .mockResolvedValue(null);
    const btn = fixture.nativeElement.querySelector('#descope-google-btn');
    expect(btn).toBeTruthy();
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should trigger resendOtp when resend button is clicked', () => {
    component['currentStep'].set('otp');
    fixture.detectChanges();
    const spy = vi
      .spyOn(component as unknown as { resendOtp: () => Promise<unknown> }, 'resendOtp')
      .mockResolvedValue(null);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const resendBtn = buttons.find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Send a new code'),
    );
    expect(resendBtn).toBeTruthy();
    (resendBtn as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('should trigger goBackToEmail when back to email button is clicked', () => {
    component['currentStep'].set('otp');
    fixture.detectChanges();
    const spy = vi.spyOn(component as unknown as { goBackToEmail: () => void }, 'goBackToEmail');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const backBtn = buttons.find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Back to Email'),
    );
    expect(backBtn).toBeTruthy();
    (backBtn as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('should trigger goBackFromProfile when back from profile button is clicked', () => {
    component['currentStep'].set('info');
    fixture.detectChanges();
    const spy = vi.spyOn(
      component as unknown as { goBackFromProfile: () => void },
      'goBackFromProfile',
    );
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const backBtn = buttons.find((b) => (b as HTMLButtonElement).textContent?.includes('Back'));
    expect(backBtn).toBeTruthy();
    (backBtn as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('should do nothing in ngOnInit if platform is not browser', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: AuthService, useValue: fakeAuthService },
        { provide: BRAND_TITLE_TOKEN, useValue: 'Test Brand' },
        { provide: MatSnackBar, useValue: fakeSnackBar },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: fakeSnackBar })
      .compileComponents();

    const fix = TestBed.createComponent(LoginComponent);
    const comp = fix.componentInstance;
    const waitSpy = vi.spyOn(fakeAuthService, 'waitForSessionInit');
    waitSpy.mockClear();

    comp.ngOnInit();
    expect(waitSpy).not.toHaveBeenCalled();
  });

  it('should not show google login button if descope is not available', () => {
    (fakeAuthService.isDescopeAvailable as WritableSignal<boolean>).set(false);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('#descope-google-btn');
    expect(btn).toBeFalsy();
  });

  it('should show default snackbar error if exchange fails and authError is empty', async () => {
    vi.mocked(fakeAuthService.waitForSessionInit).mockResolvedValue(undefined);
    fakeIsAuthenticated.set(false);
    queryParams = { code: 'code123' };
    vi.mocked(fakeAuthService.exchangeDescopeOAuthCode).mockResolvedValue(false);
    fakeAuthError.set(null);

    component.ngOnInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(snackBar.open).toHaveBeenCalledWith('Google sign in failed.', 'Close', {
      duration: 5000,
    });
  });

  it('should do nothing in ngAfterViewInit if currentStep is not email', () => {
    component['currentStep'].set('otp');
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('should show default error in resendOtp when sending fails and authError is null', async () => {
    component['userEmail'].set('john@example.com');
    component['currentStep'].set('otp');
    fixture.detectChanges();

    fakeAuthService.sendOtp.mockResolvedValue({ success: false, isNewUser: false });
    fakeAuthError.set(null);

    await component['resendOtp']();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to send new OTP. Please try again.',
      'Close',
      { duration: 5000 },
    );
  });

  it('should handle unmatched currentStep in switch block', () => {
    component['currentStep'].set('unmatched_step' as unknown as 'email');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    // When currentStep is unmatched, none of the step forms are rendered.
    expect(compiled.querySelector('form')).toBeNull();
  });

  it('should exercise all disabled states for verify-otp submit button', () => {
    component['currentStep'].set('otp');
    fixture.detectChanges();

    // Case 1: invalid code, not submitting (should be disabled)
    component['step2Model'].set({ code: '123' });
    component['submittingStep2'].set(false);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);

    // Case 2: valid code, submitting (should be disabled)
    component['step2Model'].set({ code: '123456' });
    component['submittingStep2'].set(true);
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);

    // Case 3: valid code, not submitting (should NOT be disabled)
    component['step2Model'].set({ code: '123456' });
    component['submittingStep2'].set(false);
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });
});
