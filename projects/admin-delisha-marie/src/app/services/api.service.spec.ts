import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format URLs and perform GET request', async () => {
    const mockData = { success: true };

    const promise = service.get<{ success: boolean }>('recipes');
    const req = httpMock.expectOne('/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    const res = await promise;
    expect(res).toEqual(mockData);
  });

  it('should format URLs and perform POST request', async () => {
    const mockData = { id: 1 };
    const body = { title: 'Test' };

    const promise = service.post<{ id: number }>('/recipes', body);
    const req = httpMock.expectOne('/api/recipes');
    expect(req.request.method).toBe('POST');
    req.flush(mockData);

    const res = await promise;
    expect(res).toEqual(mockData);
  });

  it('should format URLs and perform PUT request', async () => {
    const mockData = { id: 1 };
    const body = { title: 'Updated' };

    const promise = service.put<{ id: number }>('/api/recipes/1', body);
    const req = httpMock.expectOne('/api/recipes/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockData);

    const res = await promise;
    expect(res).toEqual(mockData);
  });

  it('should format URLs and perform DELETE request', async () => {
    const mockData = { deleted: true };

    const promise = service.delete<{ deleted: boolean }>('recipes/1');
    const req = httpMock.expectOne('/api/recipes/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockData);

    const res = await promise;
    expect(res).toEqual(mockData);
  });

  it('should merge provided options and always include withCredentials', async () => {
    const headers = new HttpHeaders({ 'X-Custom-Header': 'value' });
    const params = new HttpParams().set('page', '1');

    service.get('test', { headers, params });

    const req = httpMock.expectOne((request) => request.url === '/api/test');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('X-Custom-Header')).toBe('value');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({});
  });

  describe('SSR Context', () => {
    let ssrService: ApiService;
    let ssrHttpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.resetTestingModule();

      const mockRequest = {
        headers: {
          get: (name: string) => (name === 'cookie' ? 'my_test_cookie=123' : null),
        },
      };

      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          ApiService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: mockRequest },
        ],
      });

      ssrService = TestBed.inject(ApiService);
      ssrHttpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      ssrHttpMock.verify();
    });

    it('should forward cookies from the request when running on the server', async () => {
      ssrService.get('test');

      const req = ssrHttpMock.expectOne('/api/test');
      expect(req.request.headers.get('cookie')).toBe('my_test_cookie=123');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('should preserve existing headers while forwarding cookies on the server', async () => {
      const existingHeaders = new HttpHeaders({ Authorization: 'Bearer token' });
      ssrService.get('test', { headers: existingHeaders });

      const req = ssrHttpMock.expectOne('/api/test');
      expect(req.request.headers.get('cookie')).toBe('my_test_cookie=123');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token');
      req.flush({});
    });
  });
});
