import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesService } from './pages.service';
import { ApiService } from './api.service';

describe('PagesService', () => {
  let service: PagesService;
  let apiSpy: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { get: vi.fn(), put: vi.fn() };
    TestBed.configureTestingModule({
      providers: [PagesService, { provide: ApiService, useValue: apiSpy }],
    });
    service = TestBed.inject(PagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all pages', async () => {
    const mockPages = [{ slug: 'about', title: 'About' }];
    apiSpy.get.mockResolvedValue(mockPages);

    const result = await service.getPages();
    expect(apiSpy.get).toHaveBeenCalledWith('/pages');
    expect(result).toEqual(mockPages as import('./pages.service').Page[]);
  });

  it('should fetch a single page', async () => {
    const mockPage = { slug: 'about', title: 'About' };
    apiSpy.get.mockResolvedValue(mockPage);

    const result = await service.getPage('about');
    expect(apiSpy.get).toHaveBeenCalledWith('/pages/about');
    expect(result).toEqual(mockPage as import('./pages.service').Page);
  });

  it('should save a page', async () => {
    const mockPage = { slug: 'about', title: 'About', content: 'new content' };
    apiSpy.put.mockResolvedValue(mockPage);

    const result = await service.savePage('about', mockPage);
    expect(apiSpy.put).toHaveBeenCalledWith('/pages/about', mockPage);
    expect(result).toEqual(mockPage as import('./pages.service').Page);
  });

  it('should throw if getPages fails', async () => {
    apiSpy.get.mockRejectedValue(new Error('fail'));
    await expect(service.getPages()).rejects.toThrow('fail');
  });

  it('should throw if getPage fails', async () => {
    apiSpy.get.mockRejectedValue(new Error('fail'));
    await expect(service.getPage('about')).rejects.toThrow('fail');
  });
});
