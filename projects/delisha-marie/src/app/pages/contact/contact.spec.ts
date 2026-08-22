import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactPage } from './contact';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PagesService, Page } from '../../services/pages.service';
import { IMAGE_LOADER } from '@angular/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { SeoService } from '../../services/seo.service';

describe('ContactPage', () => {
  let component: ContactPage;
  let fixture: ComponentFixture<ContactPage>;
  let mockPagesService: Record<string, ReturnType<typeof vi.fn>>;
  let mockSeoService: Record<string, ReturnType<typeof vi.fn>>;
  let routeParams$: BehaviorSubject<{ slug?: string }>;

  beforeEach(async () => {
    mockPagesService = {
      getPage: vi.fn(),
    };
    mockSeoService = {
      setSeoData: vi.fn(),
    };
    routeParams$ = new BehaviorSubject<{ slug?: string }>({ slug: 'contact' });

    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$,
            queryParams: new BehaviorSubject({}),
          },
        },
        { provide: PagesService, useValue: mockPagesService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load contact page content', async () => {
    const mockPage: Page = {
      id: '1',
      title: 'Contact Us',
      slug: 'contact',
      content: '<p>Contact Content</p>',
      updated_at: '2026-08-01',
    };
    mockPagesService['getPage'].mockResolvedValue(mockPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('contact');
    expect(component['page']()).toEqual(mockPage);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-colored-header')).toBeTruthy();
    expect(compiled.querySelector('.story')).toBeTruthy();
    expect(compiled.innerHTML).toContain('Contact Content');
  });

  it('should handle error when page load fails', async () => {
    mockPagesService['getPage'].mockRejectedValue(new Error('Load Failed'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['page']()).toBeNull();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.story')).toBeNull();
  });

  it('should correctly expose loading state', async () => {
    mockPagesService['getPage'].mockReturnValue(new Promise(() => undefined)); // Never resolves
    fixture.detectChanges();

    expect(component['loading']()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
  });
});
