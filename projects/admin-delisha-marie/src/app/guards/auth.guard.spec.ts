import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let isAuth = false;
  let navigated: unknown[] = [];

  const fakeAuthService = {
    isAuthenticated: () => isAuth,
    waitForSessionInit: async () => Promise.resolve(),
  };

  const fakeRouter = {
    navigate: (commands: unknown[]) => {
      navigated = commands;
    },
  };

  beforeEach(() => {
    isAuth = false;
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuthService },
        { provide: Router, useValue: fakeRouter },
      ],
    });
  });

  it('should redirect if user is not logged in', async () => {
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard();
      expect(result).toBe(false);
      expect(navigated).toEqual(['/login']);
    });
  });

  it('should allow if user is logged in', async () => {
    isAuth = true;
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard();
      expect(result).toBe(true);
      expect(navigated).toEqual([]);
    });
  });

  it('should bypass logic when not on platform browser (SSR state)', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });

    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard();
      expect(result).toBe(true);
      expect(navigated).toEqual([]);
    });
  });
});
