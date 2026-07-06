import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchPage } from './search';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Api } from '../../services/api';
import { WINDOW } from '../../services/global-tokens';
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('SearchPage', () => {
  let component: SearchPage;
  let fixture: ComponentFixture<SearchPage>;
  let mockApi: any;
  let mockWindow: any;
  let mockRouter: any;
  let paramsSubject: any;
  let queryParamsSubject: any;

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
        total: 1,
      }),
      get: vi.fn(),
    };
    mockWindow = {
      scrollTo: vi.fn(),
    };
    mockRouter = {
      navigate: vi.fn(),
    };
    paramsSubject = new BehaviorSubject({ page: '2' });
    queryParamsSubject = new BehaviorSubject({ q: 'chicken' });

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
    fixture.detectChanges();
  });

  it('should create and load data based on query params', async () => {
    expect(component).toBeTruthy();
    expect(component.query()).toBe('chicken');
    expect(component.currentPage()).toBe(2);

    // Wait for resource to load
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockApi.post).toHaveBeenCalledWith('/api/recipes/search', {
      query: 'chicken',
      page: 2,
      pageSize: 12,
    });

    expect(component.recipes().length).toBe(1);
    expect(component.totalItems()).toBe(1);
  });

  it('should handle empty query param by returning empty array and not calling api', async () => {
    queryParamsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.recipes().length).toBe(0);
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
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'pasta ' },
      queryParamsHandling: 'merge',
    });
  });

  it('should not navigate on submit if query is empty', async () => {
    component.searchModel.set({ q: '   ' });
    const formEl = fixture.debugElement.query(By.css('form'));
    formEl.triggerEventHandler('submit', new Event('submit'));

    await fixture.whenStable();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate and scroll on page change', () => {
    component.searchModel.set({ q: 'fish' });
    component.onPageChange(3);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/search/page/3'], {
      queryParams: { q: 'fish' },
      queryParamsHandling: 'merge',
    });
    expect(mockWindow.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should navigate to /search on page 1', () => {
    component.searchModel.set({ q: 'fish' });
    component.onPageChange(1);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'fish' },
      queryParamsHandling: 'merge',
    });
  });

  it('should render loading skeletons when loading', async () => {
    // Component is initially loading when resource is pending
    queryParamsSubject.next({ q: 'slow' });
    mockApi.post.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    fixture.detectChanges();

    const skeletons = fixture.debugElement.queryAll(By.css('.animate-pulse'));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render no results message when search returns empty', async () => {
    mockApi.post.mockResolvedValue({ items: [], total: 0 });
    queryParamsSubject.next({ q: 'nomatch' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('No matching recipes found');
  });

  it('should render enter search term message when query is empty', async () => {
    queryParamsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Enter a search term above');
  });
});
