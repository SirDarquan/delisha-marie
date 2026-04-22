import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { seoResolver } from './seo.resolver';
import { SeoService } from '../services/seo.service';
import { DOCUMENT } from '@angular/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('seoResolver', () => {
  let seoService: SeoService;
  let mockDocument: { location: { origin: string; href: string } };

  beforeEach(() => {
    mockDocument = {
      location: { origin: 'http://localhost:4200', href: 'http://localhost:4200/test' },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SeoService, useValue: { setSEO: vi.fn() } },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    seoService = TestBed.inject(SeoService);
  });

  it('should call seoService.setSEO with resolved data and placeholders', () => {
    const route = {
      data: {
        description: 'Test Description',
      },
      title: 'Test',
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/test' } as RouterStateSnapshot;

    TestBed.runInInjectionContext(() => {
      seoResolver(route, state);
    });

    expect(seoService.setSEO).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test | Delisha Marie',
        description: 'Test Description',
        url: 'http://localhost:4200/test',
      }),
    );
  });
});
