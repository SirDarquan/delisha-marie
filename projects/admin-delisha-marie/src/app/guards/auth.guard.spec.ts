import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let isAuth = false;
  let status = 'active';
  let isAdmin = false;
  let isImpersonating = false;
  let currentPlatformId = 'browser';

  const fakeAuthService = {
    isAuthenticated: () => isAuth,
    userStatus: () => status,
    isAdmin: () => isAdmin,
    isImpersonating: () => isImpersonating,
    waitForSessionInit: async () => Promise.resolve(),
  };

  const fakeRouter = {
    createUrlTree: (commands: unknown[], extras?: unknown) => {
      return { _mockUrlTree: commands[0], _extras: extras } as unknown as UrlTree;
    },
  };

  const mockRoute = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    isAuth = false;
    status = 'active';
    isAdmin = false;
    isImpersonating = false;
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
      const result = await authGuard(mockRoute, { url: '/recipes' } as RouterStateSnapshot);
      expect(result).toEqual({
        _mockUrlTree: '/login',
        _extras: { queryParams: { returnUrl: '/recipes' } },
      } as unknown as UrlTree);
    });
  });

  it('should allow if member is logged in and active', async () => {
    isAuth = true;
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, { url: '/recipes' } as RouterStateSnapshot);
      expect(result).toBe(true);
    });
  });

  it('should redirect to /pending-approval when status is pending', async () => {
    isAuth = true;
    status = 'pending';
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, { url: '/recipes' } as RouterStateSnapshot);
      expect(result).toEqual({
        _mockUrlTree: '/pending-approval',
        _extras: undefined,
      } as unknown as UrlTree);
    });
  });

  it('should allow pending user to access /pending-approval route', async () => {
    isAuth = true;
    status = 'pending';
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, {
        url: '/pending-approval',
      } as RouterStateSnapshot);
      expect(result).toBe(true);
    });
  });

  it('should redirect active user away from /pending-approval to /', async () => {
    isAuth = true;
    status = 'active';
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, {
        url: '/pending-approval',
      } as RouterStateSnapshot);
      expect(result).toEqual({
        _mockUrlTree: '/',
        _extras: undefined,
      } as unknown as UrlTree);
    });
  });

  it('should redirect member away from admin /users page to /', async () => {
    isAuth = true;
    isAdmin = false;
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, { url: '/users' } as RouterStateSnapshot);
      expect(result).toEqual({
        _mockUrlTree: '/',
        _extras: undefined,
      } as unknown as UrlTree);
    });
  });

  it('should redirect admin away from /recipes to /users if not impersonating', async () => {
    isAuth = true;
    isAdmin = true;
    isImpersonating = false;
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, { url: '/recipes' } as RouterStateSnapshot);
      expect(result).toEqual({
        _mockUrlTree: '/users',
        _extras: undefined,
      } as unknown as UrlTree);
    });
  });

  it('should allow admin to access /recipes when impersonating a member', async () => {
    isAuth = true;
    isAdmin = true;
    isImpersonating = true;
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, { url: '/recipes' } as RouterStateSnapshot);
      expect(result).toBe(true);
    });
  });

  it('should bypass guard check and allow access during SSR (non-browser platform)', async () => {
    currentPlatformId = 'server';
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard(mockRoute, { url: '/recipes' } as RouterStateSnapshot);
      expect(result).toBe(true);
    });
  });
});
