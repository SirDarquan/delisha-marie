import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Api } from './api';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Api', () => {
  let service: Api;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Api],
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
    const promise = service.get<typeof mockData>('/api/test');

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });

  it('should make POST request and return promise', async () => {
    const mockData = { success: true };
    const body = { name: 'New' };
    const promise = service.post<typeof mockData>('/api/test', body);

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });
});
