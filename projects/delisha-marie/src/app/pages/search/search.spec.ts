import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { SearchPage } from './search';
import { Router, ActivatedRoute } from '@angular/router';
import { Api } from '../../services/api';
import { WINDOW } from '../../services/global-tokens';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('SearchPage', () => {
  let component: SearchPage;
  let fixture: ComponentFixture<SearchPage>;
  let mockApi: Record<string, ReturnType<typeof vi.fn>>;
  let mockWindow: Record<string, ReturnType<typeof vi.fn>>;
  let mockRouter: Record<string, ReturnType<typeof vi.fn>>;
  let paramsSubject: BehaviorSubject<Record<string, string>>;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;

  beforeEach(async () => {
    mockApi = {
      post: vi.fn().mockResolvedValue({
        items: [
          {
            id: '1',
            slug: 'test',
            title: 'Test Recipe',
            description: 'Desc',
            image: 'img.jpg',
            similarity: 0.99,
          },
        ],
        total: 15,
      }),
      get: vi.fn(),
    };
    mockWindow = {
      scrollTo: vi.fn(),
    };
    mockRouter = {
      navigate: vi.fn(),
    };
    paramsSubject = new BehaviorSubject<Record<string, string>>({ page: '2' });
    queryParamsSubject = new BehaviorSubject<Record<string, string>>({ q: 'chicken' });

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        { provide: Api, useValue: mockApi },
        { provide: WINDOW, useValue: mockWindow },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject,
            queryParams: queryParamsSubject,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    component = fixture.componentInstance;

    // Mock document.defaultView.scrollTo because JSDOM does not implement it
    const defaultView = TestBed.inject(DOCUMENT).defaultView;
    if (defaultView) {
      Object.defineProperty(defaultView, 'scrollTo', {
        value: mockWindow['scrollTo'],
        writable: true,
      });
    }

    fixture.detectChanges();
  });

  it('should create and load data based on query params', async () => {
    expect(component).toBeTruthy();
    expect(component.query()).toBe('chicken');
    expect(component.currentPage()).toBe(2);

    // Wait for resource to load
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(mockApi['post']).toHaveBeenCalledWith('/search', {
      query: 'chicken',
      page: 2,
      pageSize: 12,
    });

    expect(component.recipes()).toHaveLength(1);
    expect(component.totalItems()).toBe(15);

    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('a').length).toBeGreaterThan(0);
  });

  it('should handle empty query param by returning empty array and not calling api', async () => {
    queryParamsSubject.next({});
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component.recipes()).toHaveLength(0);
    expect(component.totalItems()).toBe(0);
  });

  it('should update searchModel when query string changes', () => {
    queryParamsSubject.next({ q: 'beef' });
    fixture.detectChanges();
    expect(component.searchModel().q).toBe('beef');
  });

  it('should submit form and navigate', async () => {
    component.searchModel.set({ q: 'pasta ' });

    // Trigger submission
    const formEl = fixture.debugElement.query(By.css('form'));
    formEl.triggerEventHandler('submit', new Event('submit'));

    await fixture.whenStable();
    expect(mockRouter['navigate']).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'pasta ' },
      queryParamsHandling: 'merge',
    });
  });

  it('should not navigate on submit if query is empty', async () => {
    component.searchModel.set({ q: '   ' });
    const formEl = fixture.debugElement.query(By.css('form'));
    formEl.triggerEventHandler('submit', new Event('submit'));

    await fixture.whenStable();
    expect(mockRouter['navigate']).not.toHaveBeenCalled();
  });

  it('should navigate and scroll on page change', () => {
    component.searchModel.set({ q: 'fish' });
    component.onPageChange(3);

    expect(mockRouter['navigate']).toHaveBeenCalledWith(['/search/page/3'], {
      queryParams: { q: 'fish' },
      queryParamsHandling: 'merge',
    });
    expect(mockWindow['scrollTo']).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should navigate to /search on page 1', () => {
    component.searchModel.set({ q: 'fish' });
    component.onPageChange(1);

    expect(mockRouter['navigate']).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'fish' },
      queryParamsHandling: 'merge',
    });
  });

  it('should render loading skeletons when loading', async () => {
    // Component is initially loading when resource is pending
    queryParamsSubject.next({ q: 'slow' });
    mockApi['post'].mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    fixture.detectChanges();

    const skeletons = fixture.debugElement.queryAll(By.css('.animate-pulse'));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render no results message when search returns empty', async () => {
    mockApi['post'].mockResolvedValue({ items: [], total: 0 });
    queryParamsSubject.next({ q: 'nomatch' });
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('No matching recipes found');
  });

  it('should render enter search term message when query is empty', async () => {
    queryParamsSubject.next({});
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Enter a search term above');
  });
});
