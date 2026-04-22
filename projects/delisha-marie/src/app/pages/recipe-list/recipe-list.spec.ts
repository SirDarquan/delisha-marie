import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeList } from './recipe-list';
import { provideRouter, Router, ActivatedRoute, NavigationEnd, Event } from '@angular/router';
import { RecipeService, Recipe } from '../../services/recipe.service';
import { RecipeIndexService } from '../../services/recipe-index.service';
import { WINDOW } from '../../services/global-tokens';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Subject } from 'rxjs';

describe('RecipeList', () => {
  let component: RecipeList;
  let fixture: ComponentFixture<RecipeList>;
  let router: Router;
  let windowMock: { scrollTo: Mock };

  const routerEventsSubject = new Subject<Event>();

  const mockRecipes: Recipe[] = [
    {
      id: 1,
      title: 'Recipe 1',
      description: 'Desc 1',
      image: 'img1.jpg',
      category: 'cat1',
      prepTime: '10m',
      cookTime: '20m',
      difficulty: 'Easy',
      featured: false,
      slug: 'recipe-1',
      method: 'Baking',
    },
    {
      id: 2,
      title: 'Recipe 2',
      description: 'Desc 2',
      image: 'img2.jpg',
      category: 'cat1',
      prepTime: '10m',
      cookTime: '20m',
      difficulty: 'Easy',
      featured: false,
      slug: 'recipe-2',
      method: 'Baking',
    },
  ];

  const recipeServiceMock = {
    getRecipes: vi.fn().mockResolvedValue({ items: mockRecipes, total: 2 }),
  };

  const recipeIndexServiceMock = {
    getData: vi.fn().mockResolvedValue({
      categoriesList: [
        {
          name: 'Desserts',
          url: '/recipes/desserts',
          children: [{ name: 'Cakes', url: '/recipes/desserts/cakes' }],
        },
      ],
      methodsList: [],
      holidays: [],
      specialDiets: [],
      bestRecipes: [],
      ingredients: [],
    }),
  };

  beforeEach(async () => {
    windowMock = { scrollTo: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RecipeList],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: RecipeIndexService, useValue: recipeIndexServiceMock },
        { provide: WINDOW, useValue: windowMock },
        {
          provide: ActivatedRoute,
          useValue: {
            params: new Subject(),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

    // Mock router events and url
    Object.defineProperty(router, 'events', { value: routerEventsSubject.asObservable() });
    Object.defineProperty(router, 'url', { value: '/recipes', writable: true });
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load recipes and calculate total pages correctly', async () => {
    routerEventsSubject.next(new NavigationEnd(1, '/recipes', '/recipes'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.recipes().length).toBe(2);
    expect(component.totalItems()).toBe(2);
    expect(component.totalPages()).toBe(1);
  });

  it('should compute rootType correctly', async () => {
    Object.defineProperty(router, 'url', { value: '/the-best-recipes' });
    routerEventsSubject.next(new NavigationEnd(1, '/the-best-recipes', '/the-best-recipes'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('The Best Recipes');

    Object.defineProperty(router, 'url', { value: '/special-diets' });
    routerEventsSubject.next(new NavigationEnd(2, '/special-diets', '/special-diets'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('Special Diets');
  });

  it('should compute displayTitle correctly when no category or subcategory', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    routerEventsSubject.next(new NavigationEnd(1, '/recipes', '/recipes'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.displayTitle()).toBe('Recipes');
  });

  it('should compute base breadcrumbs', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    routerEventsSubject.next(new NavigationEnd(1, '/recipes', '/recipes'));
    fixture.detectChanges();
    await fixture.whenStable();
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs[0].label).toBe('Home');
    expect(breadcrumbs[1].label).toBe('Recipes');
  });

  it('should navigate on page change and scroll to top', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    routerEventsSubject.next(new NavigationEnd(1, '/recipes', '/recipes'));
    fixture.detectChanges();
    await fixture.whenStable();

    component.onPageChange(2);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes/page/2');
    expect(windowMock.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should return correct base path', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes/desserts/page/2' });
    routerEventsSubject.next(
      new NavigationEnd(1, '/recipes/desserts/page/2', '/recipes/desserts/page/2'),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.basePath()).toBe('/recipes/desserts');
  });
});
