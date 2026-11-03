import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicPage } from './dynamic-page';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { PagesService, Page } from '../../services/pages.service';
import { SeoService } from '../../services/seo.service';
import { BehaviorSubject } from 'rxjs';
import { IMAGE_LOADER } from '@angular/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('DynamicPage', () => {
  let component: DynamicPage;
  let fixture: ComponentFixture<DynamicPage>;
  let mockPagesService: Record<string, ReturnType<typeof vi.fn>>;
  let mockSeoService: Record<string, ReturnType<typeof vi.fn>>;
  let routeParams$: BehaviorSubject<{ slug?: string }>;
  let routeData$: BehaviorSubject<Record<string, unknown>>;

  beforeEach(async () => {
    mockPagesService = {
      getPage: vi.fn(),
    };
    mockSeoService = {
      setSeoData: vi.fn(),
    };
    routeParams$ = new BehaviorSubject<{ slug?: string }>({ slug: 'about' });
    routeData$ = new BehaviorSubject<Record<string, unknown>>({});

    await TestBed.configureTestingModule({
      imports: [DynamicPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$,
            data: routeData$,
            queryParams: new BehaviorSubject({}),
          },
        },
        { provide: PagesService, useValue: mockPagesService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load a page when slug is present', async () => {
    const mockPage: Page = {
      id: '1',
      title: 'About Us',
      slug: 'about',
      content: '<p>About Content</p>',
      updated_at: '2026-08-01',
    };
    mockPagesService['getPage'].mockResolvedValue(mockPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('about');
    expect(component['page']()).toEqual(mockPage);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('About Content');
  });

  it('should load a page when slug is in data but not params', async () => {
    const mockPage: Page = {
      id: '1',
      title: 'About Us',
      slug: 'about-data',
      content: '<p>About Content</p>',
      updated_at: '2026-08-01',
    };
    mockPagesService['getPage'].mockResolvedValue(mockPage as unknown as Page);
    routeParams$.next({}); // Emits params without slug

    // Emit the new route data
    routeData$.next({ slug: 'about-data' });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('about-data');
    expect(component['page']()).toEqual(mockPage);
  });

  it('should handle error when page load fails', async () => {
    mockPagesService['getPage'].mockRejectedValue(new Error('Load Failed'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('about');
    expect(component['page']()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('Page Not Found');
  });

  it('should not load a page if slug is missing', async () => {
    routeParams$.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).not.toHaveBeenCalled();
    expect(component['page']()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('Page Not Found');
  });

  // Removed contact form test as contact form is no longer rendered by dynamic-page

  it('should correctly expose loading state', async () => {
    mockPagesService['getPage'].mockReturnValue(new Promise(() => undefined)); // Never resolves
    fixture.detectChanges();

    expect(component['loading']()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
  });
});
