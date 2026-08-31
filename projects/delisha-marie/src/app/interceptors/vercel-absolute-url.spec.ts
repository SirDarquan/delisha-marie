import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
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

  it('should make relative /api/ requests absolute using localhost by default', () => {
    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/test');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should use VERCEL_URL if available', () => {
    (window as unknown as { process?: { env: Record<string, string | undefined> } }).process!.env[
      'VERCEL_URL'
    ] = 'preview-domain.vercel.app';
    httpClient.get('/api/test2').subscribe();
    const req = httpMock.expectOne('https://preview-domain.vercel.app/api/test2');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should fallback to VERCEL_PROJECT_PRODUCTION_URL if VERCEL_URL is not available', () => {
    (window as unknown as { process?: { env: Record<string, string | undefined> } }).process!.env[
      'VERCEL_PROJECT_PRODUCTION_URL'
    ] = 'prod-domain.vercel.app';
    httpClient.get('/api/test3').subscribe();
    const req = httpMock.expectOne('https://prod-domain.vercel.app/api/test3');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should strip the "host" header if it is present', () => {
    httpClient
      .get('/api/test-header', { headers: { host: 'localhost:4000', 'other-header': 'value' } })
      .subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/test-header');
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
});
