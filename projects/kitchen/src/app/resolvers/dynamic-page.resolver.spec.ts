import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { dynamicPageResolver } from './dynamic-page.resolver';
import { PagesService } from '../services/pages.service';
import { vi, describe, expect, it, beforeEach } from 'vitest';

describe('dynamicPageResolver', () => {
  let mockPagesService: Record<string, ReturnType<typeof vi.fn>>;

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

    mockPagesService['getPage'].mockResolvedValue({ title: 'About Us' });

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as import('@angular/router').RouterStateSnapshot),
    );
    expect(result).toBe('About Us');
  });

  it('should resolve page title when slug is in data', async () => {
    const route = {
      paramMap: { get: () => null },
      data: { slug: 'contact' },
    } as unknown as ActivatedRouteSnapshot;

    mockPagesService['getPage'].mockResolvedValue({ title: 'Contact' });

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as import('@angular/router').RouterStateSnapshot),
    );
    expect(result).toBe('Contact');
  });

  it('should return "Page not found" if slug is missing', async () => {
    const route = {
      paramMap: { get: () => null },
      data: {},
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as import('@angular/router').RouterStateSnapshot),
    );
    expect(result).toBe('Page not found');
  });

  it('should return "Page Not Found" if getPage returns null', async () => {
    const route = {
      paramMap: { get: () => 'unknown' },
      data: {},
    } as unknown as ActivatedRouteSnapshot;

    mockPagesService['getPage'].mockResolvedValue(null);

    const result = await TestBed.runInInjectionContext(() =>
      dynamicPageResolver(route, {} as unknown as import('@angular/router').RouterStateSnapshot),
    );
    expect(result).toBe('Page Not Found');
  });
});
