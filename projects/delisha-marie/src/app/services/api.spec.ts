import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Api } from './api';

describe('Api', () => {
  let service: Api;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Api, provideHttpClientTesting()],
    });
    service = TestBed.inject(Api);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make GET request and return promise', async () => {
    const mockData = { id: 1, name: 'Test' };
    const promise = service.get<typeof mockData>('/test');

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });

  it('should make POST request and return promise', async () => {
    const mockData = { success: true };
    const body = { name: 'New' };
    const promise = service.post<typeof mockData>('/test', body);

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });

  describe('normalizeUrl', () => {
    it('should prepend /api if not present', async () => {
      const promise = service.get('/test/endpoint');
      httpMock.expectOne('/api/test/endpoint').flush({});
      await promise;
    });
  });
});
