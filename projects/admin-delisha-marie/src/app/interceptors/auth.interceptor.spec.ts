import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuthService: { logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      logout: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through successful requests', () => {
    let responseData: unknown;
    httpClient.get('/api/recipes').subscribe((data) => {
      responseData = data;
    });

    const req = httpMock.expectOne('/api/recipes');
    req.flush({ success: true });

    expect(responseData).toEqual({ success: true });
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should call logout on 401 for normal endpoints', () => {
    let errorResponse: unknown;
    httpClient.get('/api/recipes').subscribe({
      next: () => {
        /* noop */
      },
      error: (err) => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/api/recipes');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorResponse).toBeDefined();
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });

  it('should NOT call logout on 401 for /auth/session endpoint', () => {
    let errorResponse: unknown;
    httpClient.get('/auth/session').subscribe({
      next: () => {
        /* noop */
      },
      error: (err) => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/auth/session');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorResponse).toBeDefined();
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should NOT call logout on 401 for /auth/me endpoint', () => {
    let errorResponse: unknown;
    httpClient.get('/auth/me').subscribe({
      next: () => {
        /* noop */
      },
      error: (err) => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/auth/me');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorResponse).toBeDefined();
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should NOT call logout on 401 for /auth/signout endpoint', () => {
    let errorResponse: unknown;
    httpClient.post('/auth/signout', {}).subscribe({
      next: () => {
        /* noop */
      },
      error: (err) => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/auth/signout');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorResponse).toBeDefined();
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should NOT call logout on non-401 errors (e.g. 500)', () => {
    let errorResponse: unknown;
    httpClient.get('/api/recipes').subscribe({
      next: () => {
        /* noop */
      },
      error: (err) => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/api/recipes');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorResponse).toBeDefined();
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });
});
