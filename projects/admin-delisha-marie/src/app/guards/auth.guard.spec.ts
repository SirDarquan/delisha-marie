import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let isAuth = false;
  let currentPlatformId = 'browser';

  const fakeAuthService = {
    isAuthenticated: () => isAuth,
    waitForSessionInit: async () => Promise.resolve(),
  };

  const fakeRouter = {
    createUrlTree: (commands: unknown[], extras?: unknown) => {
      return { _mockUrlTree: commands[0], _extras: extras } as unknown as UrlTree;
    },
  };

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/recipes' } as RouterStateSnapshot;

  beforeEach(() => {
    isAuth = false;
    currentPlatformId = 'browser';

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuthService },
        { provide: Router, useValue: fakeRouter },
        { provide: PLATFORM_ID, useFactory: () => currentPlatformId },
      ],
    });
  });

  it('should redirect to /login if user is not logged in and pass returnUrl', async () => {
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, mockState);
      expect(result).toEqual({
        _mockUrlTree: '/login',
        _extras: { queryParams: { returnUrl: '/recipes' } },
      } as unknown as UrlTree);
    });
  });

  it('should allow if user is logged in', async () => {
    isAuth = true;
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, mockState);
      expect(result).toBe(true);
    });
  });

  it('should bypass guard check and allow access during SSR (non-browser platform)', async () => {
    currentPlatformId = 'server';
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, mockState);
      expect(result).toBe(true);
    });
  });
});
