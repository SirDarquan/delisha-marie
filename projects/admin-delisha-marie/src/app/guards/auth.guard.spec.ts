import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let isAuth = false;

  const fakeAuthService = {
    isAuthenticated: () => isAuth,
    waitForSessionInit: async () => Promise.resolve(),
  };

  const fakeRouter = {
    parseUrl: (url: string) => {
      return { _mockUrlTree: url } as unknown as UrlTree;
    },
  };

  beforeEach(() => {
    isAuth = false;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuthService },
        { provide: Router, useValue: fakeRouter },
      ],
    });
  });

  it('should redirect to /login if user is not logged in', async () => {
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard();
      expect(result).toEqual({ _mockUrlTree: '/login' } as unknown as UrlTree);
    });
  });

  it('should allow if user is logged in', async () => {
    isAuth = true;
    await TestBed.runInInjectionContext(async () => {
      const result = await authGuard();
      expect(result).toBe(true);
    });
  });
});
