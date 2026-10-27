import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesService } from '../services/pages.service';
import { dynamicPageResolver } from './dynamic-page.resolver';

describe('dynamicPageResolver (delisha-home)', () => {
  let mockPagesService: { getPage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockPagesService = {
      getPage: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: PagesService, useValue: mockPagesService }],
    });
  });

  it('should resolve page title when slug is in paramMap', async () => {
    const route = {
      paramMap: { get: () => 'about' },
      data: {},
    } as unknown as ActivatedRouteSnapshot;

    mockPagesService.getPage.mockResolvedValue({ title: 'About Delisha Marie' });

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as RouterStateSnapshot),
    );
    expect(mockPagesService.getPage).toHaveBeenCalledWith('about');
    expect(result).toBe('About Delisha Marie');
  });

  it('should resolve page title when slug is in route data', async () => {
    const route = {
      paramMap: { get: () => null },
      data: { slug: 'faq' },
    } as unknown as ActivatedRouteSnapshot;

    mockPagesService.getPage.mockResolvedValue({ title: 'Frequently Asked Questions' });

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as RouterStateSnapshot),
    );
    expect(mockPagesService.getPage).toHaveBeenCalledWith('faq');
    expect(result).toBe('Frequently Asked Questions');
  });

  it('should return "Page not found" when slug is missing', async () => {
    const route = {
      paramMap: { get: () => null },
      data: {},
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as RouterStateSnapshot),
    );
    expect(result).toBe('Page not found');
  });

  it('should return "Page Not Found" when getPage returns null', async () => {
    const route = {
      paramMap: { get: () => 'unknown' },
      data: {},
    } as unknown as ActivatedRouteSnapshot;

    mockPagesService.getPage.mockResolvedValue(null);

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as RouterStateSnapshot),
    );
    expect(result).toBe('Page Not Found');
  });
});
