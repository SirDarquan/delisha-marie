import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactPage } from './contact';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PagesService } from '../../services/pages.service';
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

  it('should render page layout', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-page-layout')).toBeTruthy();
  });
});
