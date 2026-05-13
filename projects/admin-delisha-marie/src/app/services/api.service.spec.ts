import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
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
});
