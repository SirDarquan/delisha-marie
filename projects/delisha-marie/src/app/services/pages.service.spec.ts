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

  it('should fetch a single page', async () => {
    const mockPage = { title: 'About', content: '<p>Content</p>', updated_at: '2026-08-01' };
    apiSpy.get.mockResolvedValue(mockPage);

    const result = await service.getPage('about');
    expect(apiSpy.get).toHaveBeenCalledWith('/pages/about');
    expect(result).toEqual(mockPage);
  });

  it('should return null if api fails', async () => {
    apiSpy.get.mockRejectedValue(new Error('Network error'));

    const result = await service.getPage('about');
    expect(result).toBeNull();
  });
});
