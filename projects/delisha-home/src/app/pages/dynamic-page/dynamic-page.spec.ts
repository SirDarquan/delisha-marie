import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Page, PagesService } from '../../services/pages.service';
import { DynamicPage } from './dynamic-page';

describe('DynamicPage (delisha-home)', () => {
  let component: DynamicPage;
  let fixture: ComponentFixture<DynamicPage>;
  let mockPagesService: { getPage: ReturnType<typeof vi.fn> };
  let routeParams$: BehaviorSubject<{ slug?: string }>;
  let routeData$: BehaviorSubject<Record<string, unknown>>;

  beforeEach(async () => {
    mockPagesService = {
      getPage: vi.fn(),
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the About page via home:about slug from the database', async () => {
    const aboutPage: Page = {
      id: 'home-about',
      slug: 'home:about',
      title: 'About Delisha Marie',
      description:
        'Elevating everyday home cooking into an art of warmth & connection. From soulful generational recipes to modern kitchen discoveries, every dish is crafted with intention, patience, and love.',
      updated_at: '2026-10-25T00:00:00.000Z',
      content: `
        <section>
          <h2>The Culinary Journey</h2>
        </section>
        <div>
          <h3>Real Ingredients</h3>
          <h3>Soul &amp; Heritage</h3>
          <h3>Kitchen Mastery</h3>
        </div>
        <section>
          <a href="{{kitchenUrl}}">Visit the Kitchen</a>
        </section>
      `,
    };
    mockPagesService.getPage.mockResolvedValue(aboutPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService.getPage).toHaveBeenCalledWith('about');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-colored-header')).toBeTruthy();
    expect(compiled.querySelector('h1')?.textContent).toContain('About');
    expect(compiled.querySelector('h1')?.textContent).toContain('Delisha Marie');
    expect(compiled.textContent).toContain('Elevating everyday home cooking');
    expect(compiled.textContent).toContain('The Culinary Journey');
    expect(compiled.textContent).toContain('Real Ingredients');
    expect(compiled.textContent).toContain('Soul & Heritage');
    expect(compiled.textContent).toContain('Kitchen Mastery');

    const ctaLink = compiled.querySelector('section a');
    expect(ctaLink).toBeTruthy();
    expect(ctaLink?.getAttribute('href')).toBe(component.kitchenUrl);
    expect(ctaLink?.textContent).toContain('Visit the Kitchen');
  });

  it('should load a page when slug is provided via route data and transform mat-icon and kitchenUrl placeholders', async () => {
    const mockPage: Page = {
      id: '2',
      title: 'Custom Home Page',
      slug: 'home:custom',
      content:
        '<p>Welcome</p><mat-icon class="!text-3xl">spa</mat-icon><mat-icon>star</mat-icon><a href="{{kitchenUrl}}">Go</a>',
      updated_at: '2026-10-25',
    };
    mockPagesService.getPage.mockResolvedValue(mockPage);
    routeParams$.next({});
    routeData$.next({ slug: 'custom' });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService.getPage).toHaveBeenCalledWith('custom');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('material-icons !text-3xl');
    expect(compiled.innerHTML).toContain(component.kitchenUrl);
  });

  it('should show loading state while page is loading', () => {
    mockPagesService.getPage.mockImplementation(
      () =>
        new Promise(() => {
          // pending
        }),
    );

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should show Page Not Found when getPage returns null or slug is missing', async () => {
    mockPagesService.getPage.mockResolvedValue(null);
    routeParams$.next({});
    routeData$.next({});

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Page Not Found');
  });

  it('should handle errors gracefully when getPage rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockPagesService.getPage.mockRejectedValue(new Error('Load error'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Page Not Found');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load page', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should handle falsy slug early return in resource loader', async () => {
    routeParams$.next({ slug: '' });
    routeData$.next({});
    const emptyFixture = TestBed.createComponent(DynamicPage);
    emptyFixture.detectChanges();
    await emptyFixture.whenStable();
    emptyFixture.detectChanges();

    const compiled = emptyFixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Page Not Found');
    expect(mockPagesService.getPage).not.toHaveBeenCalled();
  });

  it('should return null safeContent when page has empty or falsy content', async () => {
    const pageWithNoContent: Page = {
      id: 'empty-1',
      slug: 'home:empty',
      title: 'Empty Page',
      description: 'Page with no content',
      updated_at: '2026-10-25',
      content: '',
    };
    mockPagesService.getPage.mockResolvedValue(pageWithNoContent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['page']()?.title).toBe('Empty Page');
    expect(component['safeContent']()).toBeNull();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.story')?.innerHTML).toBe('');
  });
});
