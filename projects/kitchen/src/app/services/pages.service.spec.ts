import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesService } from './pages.service';
import { Api } from './api';

describe('PagesService', () => {
  let service: PagesService;
  let apiSpy: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [PagesService, { provide: Api, useValue: apiSpy }],
    });
    service = TestBed.inject(PagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch a single page with kitchen: namespace prefix', async () => {
    const mockPage = { title: 'About', content: '<p>Content</p>', updated_at: '2026-08-01' };
    apiSpy.get.mockResolvedValue(mockPage);

    const result = await service.getPage('about');
    expect(apiSpy.get).toHaveBeenCalledWith('/pages/kitchen:about');
    expect(result).toEqual(mockPage);
  });

  it('should not double-prefix if slug already starts with kitchen:', async () => {
    const mockPage = { title: 'FAQ', content: '<p>FAQ</p>', updated_at: '2026-08-01' };
    apiSpy.get.mockResolvedValue(mockPage);

    const result = await service.getPage('kitchen:faq');
    expect(apiSpy.get).toHaveBeenCalledWith('/pages/kitchen:faq');
    expect(result).toEqual(mockPage);
  });

  it('should return null if api fails', async () => {
    apiSpy.get.mockRejectedValue(new Error('Network error'));

    const result = await service.getPage('about');
    expect(result).toBeNull();
  });

  it('should deduplicate in-flight requests and evict cache after 5000ms', async () => {
    vi.useFakeTimers();
    const mockPage = { title: 'FAQ', content: '<p>FAQ</p>', updated_at: '2026-08-01' };
    apiSpy.get.mockResolvedValue(mockPage);

    const p1 = service.getPage('faq');
    const p2 = service.getPage('faq');
    expect(apiSpy.get).toHaveBeenCalledTimes(1);
    await Promise.all([p1, p2]);

    vi.advanceTimersByTime(5000);
    await service.getPage('faq');
    expect(apiSpy.get).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
