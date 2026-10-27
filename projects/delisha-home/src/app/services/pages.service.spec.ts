import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Page, PagesService } from './pages.service';

describe('PagesService (delisha-home)', () => {
  let service: PagesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PagesService],
    });
    service = TestBed.inject(PagesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should prefix unprefixed slug with home: when fetching from API', async () => {
    const mockPage: Page = {
      id: '1',
      slug: 'home:about',
      title: 'About Delisha Marie',
      content: '<p>The Culinary Journey</p>',
      updated_at: '2026-10-25',
    };

    const promise = service.getPage('about');
    const req = httpMock.expectOne('/api/pages/home:about');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);

    const result = await promise;
    expect(result).toEqual(mockPage);
  });

  it('should not double-prefix if slug already starts with home:', async () => {
    const mockPage: Page = {
      id: '2',
      slug: 'home:privacy-policy',
      title: 'Privacy Policy',
      content: '<p>Privacy</p>',
      updated_at: '2026-10-25',
    };

    const promise = service.getPage('home:privacy-policy');
    const req = httpMock.expectOne('/api/pages/home:privacy-policy');
    req.flush(mockPage);

    const result = await promise;
    expect(result).toEqual(mockPage);
  });

  it('should return null when API returns 404 or fails', async () => {
    const promise = service.getPage('unknown-page');
    const req = httpMock.expectOne('/api/pages/home:unknown-page');
    req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result).toBeNull();
  });

  it('should deduplicate concurrent requests and evict cache after 5000ms', async () => {
    vi.useFakeTimers();
    const mockPage: Page = {
      id: '3',
      slug: 'home:terms',
      title: 'Terms',
      content: '<p>Terms</p>',
      updated_at: '2026-10-25',
    };

    const p1 = service.getPage('terms');
    const p2 = service.getPage('home:terms');

    const req1 = httpMock.expectOne('/api/pages/home:terms');
    req1.flush(mockPage);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual(mockPage);
    expect(r2).toEqual(mockPage);

    vi.advanceTimersByTime(5000);

    const p3 = service.getPage('terms');
    const req2 = httpMock.expectOne('/api/pages/home:terms');
    req2.flush(mockPage);
    await p3;
  });
});
