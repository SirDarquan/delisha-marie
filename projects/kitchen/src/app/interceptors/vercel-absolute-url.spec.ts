import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { vercelAbsoluteUrlInterceptor } from './vercel-absolute-url';

describe('vercelAbsoluteUrlInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let originalProcess: { env: Record<string, string | undefined> } | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    // Mock process.env for the tests
    originalProcess = (
      window as unknown as { process?: { env: Record<string, string | undefined> } }
    ).process;
    (window as unknown as { process?: { env: Record<string, string | undefined> } }).process = {
      env: {},
    };
  });

  afterEach(() => {
    httpMock.verify();
    if (originalProcess) {
      (window as unknown as { process?: { env: Record<string, string | undefined> } }).process =
        originalProcess;
    } else {
      delete (window as unknown as { process?: { env: Record<string, string | undefined> } })
        .process;
    }
  });

  it.each([
    {
      description: 'localhost:4201 by default for kitchen',
      env: {},
      path: '/api/test',
      expectedUrl: 'http://localhost:4201/api/test',
    },
    {
      description: 'PORT env variable if set',
      env: { PORT: '5000' },
      path: '/api/test-port',
      expectedUrl: 'http://localhost:5000/api/test-port',
    },
    {
      description: 'VERCEL_URL if available',
      env: { VERCEL_URL: 'preview-domain.vercel.app' },
      path: '/api/test2',
      expectedUrl: 'https://preview-domain.vercel.app/api/test2',
    },
    {
      description: 'VERCEL_PROJECT_PRODUCTION_URL fallback',
      env: { VERCEL_PROJECT_PRODUCTION_URL: 'prod-domain.vercel.app' },
      path: '/api/test3',
      expectedUrl: 'https://prod-domain.vercel.app/api/test3',
    },
  ])(
    'should make relative /api/ requests absolute using $description',
    ({ env, path, expectedUrl }) => {
      (
        window as unknown as { process?: { env: Record<string, string | undefined> } }
      ).process!.env = { ...env };
      httpClient.get(path).subscribe();
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({});
    },
  );

  it('should strip the "host" header if it is present', () => {
    httpClient
      .get('/api/test-header', { headers: { host: 'localhost:4000', 'other-header': 'value' } })
      .subscribe();
    const req = httpMock.expectOne('http://localhost:4201/api/test-header');
    expect(req.request.headers.has('host')).toBe(false);
    expect(req.request.headers.get('other-header')).toBe('value');
    req.flush({});
  });

  it('should pass through non-/api/ requests unmodified', () => {
    httpClient.get('/assets/image.png').subscribe();
    const req = httpMock.expectOne('/assets/image.png');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should attach x-vercel-protection-bypass header from VERCEL_AUTOMATION_BYPASS_SECRET', () => {
    (window as unknown as { process?: { env: Record<string, string | undefined> } }).process!.env[
      'VERCEL_AUTOMATION_BYPASS_SECRET'
    ] = 'secret-bypass-token';
    httpClient.get('/api/test-bypass').subscribe();
    const req = httpMock.expectOne('http://localhost:4201/api/test-bypass');
    expect(req.request.headers.get('x-vercel-protection-bypass')).toBe('secret-bypass-token');
    req.flush({});
  });

  it('should handle /kitchen/api/ endpoints correctly', () => {
    httpClient.get('/kitchen/api/recipes').subscribe();
    const req = httpMock.expectOne('http://localhost:4201/kitchen/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should handle /config and /kitchen/config endpoints correctly', () => {
    httpClient.get('/config').subscribe();
    const req1 = httpMock.expectOne('http://localhost:4201/config');
    expect(req1.request.method).toBe('GET');
    req1.flush({});

    httpClient.get('/kitchen/config').subscribe();
    const req2 = httpMock.expectOne('http://localhost:4201/kitchen/config');
    expect(req2.request.method).toBe('GET');
    req2.flush({});
  });
});

describe('vercelAbsoluteUrlInterceptor with REQUEST token', () => {
  it('should forward cookie, bypass, and authorization headers from incoming request object', () => {
    const mockRequest = {
      headers: {
        cookie: 'session_id=123',
        'x-vercel-protection-bypass': 'incoming-bypass',
        authorization: 'Bearer token123',
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: mockRequest },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/protected').subscribe();
    const req = httpMock.expectOne('http://localhost:4201/api/protected');
    expect(req.request.headers.get('cookie')).toBe('session_id=123');
    expect(req.request.headers.get('x-vercel-protection-bypass')).toBe('incoming-bypass');
    expect(req.request.headers.get('authorization')).toBe('Bearer token123');
    req.flush({});
    httpMock.verify();
  });

  it('should forward headers when incoming request has Headers instance', () => {
    const headersMap = new Map<string, string>([
      ['cookie', 'session_id=456'],
      ['x-vercel-protection-bypass', 'header-bypass'],
      ['authorization', 'Bearer token456'],
    ]);
    const mockRequest = {
      headers: {
        get: (name: string) => headersMap.get(name) || null,
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: mockRequest },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/headers-instance').subscribe();
    const req = httpMock.expectOne('http://localhost:4201/api/headers-instance');
    expect(req.request.headers.get('cookie')).toBe('session_id=456');
    expect(req.request.headers.get('x-vercel-protection-bypass')).toBe('header-bypass');
    expect(req.request.headers.get('authorization')).toBe('Bearer token456');
    req.flush({});
    httpMock.verify();
  });

  it('should pass through unchanged when running on browser platform', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/browser-call').subscribe();
    const req = httpMock.expectOne('/api/browser-call');
    expect(req.request.method).toBe('GET');
    req.flush({});
    httpMock.verify();
  });

  it('should join array header values and handle missing headers on REQUEST', () => {
    const mockRequest = {
      headers: {
        cookie: ['a=1', 'b=2'],
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: mockRequest },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/array-cookie').subscribe();
    const req = httpMock.expectOne('http://localhost:4201/api/array-cookie');
    expect(req.request.headers.get('cookie')).toBe('a=1; b=2');
    req.flush({});
    httpMock.verify();
  });

  it('should handle REQUEST object without headers property or non-object REQUEST', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: {} },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/empty-req').subscribe();
    const req = httpMock.expectOne('http://localhost:4201/api/empty-req');
    expect(req.request.headers.has('cookie')).toBe(false);
    req.flush({});
    httpMock.verify();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: 'invalid-request' },
      ],
    });

    const httpMock2 = TestBed.inject(HttpTestingController);
    const httpClient2 = TestBed.inject(HttpClient);
    httpClient2.get('/api/string-req').subscribe();
    const req2 = httpMock2.expectOne('http://localhost:4201/api/string-req');
    expect(req2.request.headers.has('cookie')).toBe(false);
    req2.flush({});
    httpMock2.verify();
  });

  it('should resolve base URL from x-forwarded-host and x-forwarded-proto/port', () => {
    const mockRequest = {
      headers: {
        'x-forwarded-host': 'custom-domain.com',
        'x-forwarded-proto': 'https',
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: mockRequest },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/forwarded').subscribe();
    const req = httpMock.expectOne('https://custom-domain.com/api/forwarded');
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toBe('https://custom-domain.com/api/forwarded');
    req.flush({});
    httpMock.verify();
  });

  it('should resolve base URL from non-localhost incoming host header', () => {
    const mockRequest = {
      headers: {
        host: 'recipes.delishamarie.com',
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: mockRequest },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/host-header').subscribe();
    const req = httpMock.expectOne('https://recipes.delishamarie.com/api/host-header');
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toBe('https://recipes.delishamarie.com/api/host-header');
    req.flush({});
    httpMock.verify();
  });
});
