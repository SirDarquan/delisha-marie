import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Subject } from 'rxjs';
import { vi, Mock } from 'vitest';
import { injectAuthCommon, BRAND_TITLE_TOKEN } from './auth-shared.utils';

describe('auth-shared.utils', () => {
  let routerMock: { navigate: Mock; navigateByUrl: Mock };
  let snackBarMock: { open: Mock };
  let authStateSubject: Subject<SocialUser | null>;
  let socialAuthServiceMock: { authState: Subject<SocialUser | null> };

  beforeEach(() => {
    routerMock = { navigate: vi.fn(), navigateByUrl: vi.fn() };
    snackBarMock = { open: vi.fn() };
    authStateSubject = new Subject<SocialUser | null>();
    socialAuthServiceMock = { authState: authStateSubject };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: SocialAuthService, useValue: socialAuthServiceMock },
      ],
    });
  });

  it('should initialize with defaults when BRAND_TITLE_TOKEN is not provided', () => {
    TestBed.runInInjectionContext(() => {
      const common = injectAuthCommon({ redirectUrl: '/' });
      expect(common.brandTitle).toBe('Admin Portal');
      expect(common.hidePassword()).toBe(true);
    });
  });

  it('should adopt the customized title when BRAND_TITLE_TOKEN is provided', () => {
    TestBed.overrideProvider(BRAND_TITLE_TOKEN, { useValue: 'Custom App' });
    TestBed.runInInjectionContext(() => {
      const common = injectAuthCommon({ redirectUrl: '/' });
      expect(common.brandTitle).toBe('Custom App');
    });
  });

  it('should flip the togglePassword signal when invoked', () => {
    TestBed.runInInjectionContext(() => {
      const common = injectAuthCommon({ redirectUrl: '/' });
      expect(common.hidePassword()).toBe(true);
      common.togglePassword();
      expect(common.hidePassword()).toBe(false);
      common.togglePassword();
      expect(common.hidePassword()).toBe(true);
    });
  });

  it('should trigger snackbar and immediate navigation on successful social authentication', () => {
    TestBed.runInInjectionContext(() => {
      // Explicitly inject to execute subscription subscription side-effects
      injectAuthCommon({ redirectUrl: '/dashboard' });

      const mockUser = { name: 'Alice Wonderland' } as SocialUser;
      authStateSubject.next(mockUser);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Successfully authenticated as Alice Wonderland! Redirecting...',
        'Close',
        { duration: 10000 },
      );
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should ignore null users propagated by social auth state subject', () => {
    TestBed.runInInjectionContext(() => {
      injectAuthCommon({ redirectUrl: '/' });
      authStateSubject.next(null);

      expect(snackBarMock.open).not.toHaveBeenCalled();
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
