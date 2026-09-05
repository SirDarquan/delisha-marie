import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCUMENT } from '@angular/common';
import { Recipe, RecipeService } from '../../services/recipe.service';
import { createMockRecipe } from '../../utils/test-recipe';
import { RecipeIndexService } from '../recipe-index/recipe-index.service';
import { RecipeList } from './recipe-list';

describe('RecipeList', () => {
  let component: RecipeList;
  let fixture: ComponentFixture<RecipeList>;
  let router: Router;
  let paramsSubject: Subject<Record<string, string>>;

  const mockRecipes: Recipe[] = [
    createMockRecipe({
      id: 1,
      title: 'Recipe 1',
      description: 'Desc 1',
      image: 'img1.jpg',
      category: 'cat1',
      prepTime: '10m',
      cookTime: '20m',
      difficulty: 'Easy',
      theBest: false,
      slug: 'recipe-1',
      method: 'Baking',
      totalTime: '30m',
      author: 'Delisha Marie',
    }),
    createMockRecipe({
      id: 2,
      title: 'Recipe 2',
      description: 'Desc 2',
      image: 'img2.jpg',
      category: 'cat1',
      prepTime: '10m',
      cookTime: '20m',
      difficulty: 'Easy',
      theBest: false,
      slug: 'recipe-2',
      method: 'Baking',
      totalTime: '30m',
      author: 'Delisha Marie',
    }),
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
    paramsSubject = new Subject<Record<string, string>>();

    await TestBed.configureTestingModule({
      imports: [RecipeList],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: RecipeIndexService, useValue: recipeIndexServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject,
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

    // Mock url
    Object.defineProperty(router, 'url', { value: '/recipes', writable: true });
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load recipes and calculate total pages correctly', async () => {
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.recipes()).toHaveLength(2);
    expect(component.totalItems()).toBe(2);
    expect(component.totalPages()).toBe(1);
  });

  it('should compute rootType correctly', async () => {
    Object.defineProperty(router, 'url', { value: '/the-best-recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('The Best Recipes');

    Object.defineProperty(router, 'url', { value: '/special-diets' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('Special Diets');

    Object.defineProperty(router, 'url', { value: '/holiday' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('Holidays');

    Object.defineProperty(router, 'url', { value: '/methods' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('Methods');

    Object.defineProperty(router, 'url', { value: '/tag' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('Tags');

    Object.defineProperty(router, 'url', { value: '/unknown-path' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('Recipes');
  });

  it('should compute displayTitle correctly when no category or subcategory', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.displayTitle()).toBe('Recipes');
  });

  it('should compute displayTitle correctly with category and subcategory', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'desserts' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.displayTitle()).toBe('Desserts');

    paramsSubject.next({ category: 'desserts', subcategory: 'cakes' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.displayTitle()).toBe('Cakes');
  });

  it('should compute base breadcrumbs', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs[0].label).toBe('Home');
    expect(breadcrumbs[1].label).toBe('Recipes');
  });

  it('should compute breadcrumbs with category and subcategory', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes/desserts/cakes' });
    paramsSubject.next({ category: 'desserts', subcategory: 'cakes' });
    fixture.detectChanges();
    await fixture.whenStable();
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs).toHaveLength(4);
    expect(breadcrumbs[1].label).toBe('Recipes'); // from segment
    expect(breadcrumbs[2].label).toBe('Desserts');
    expect(breadcrumbs[3].label).toBe('Cakes');
  });

  it('should navigate on page change and scroll to top', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();

    const document = TestBed.inject(DOCUMENT);
    const scrollToSpy = vi.spyOn(document.defaultView!, 'scrollTo').mockImplementation(function () {
      return;
    });

    component.onPageChange(2);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes/page/2');
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should return correct base path', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes/desserts/page/2' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.basePath()).toBe('/recipes/desserts');
  });

  it('should return subcategories properly depending on rootType', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'desserts' });
    fixture.detectChanges();
    await fixture.whenStable();
    const subcats = component.subCategories();
    expect(subcats).toHaveLength(1);
    expect(subcats[0].name).toBe('Cakes');

    // Subcategory should return empty array
    paramsSubject.next({ category: 'desserts', subcategory: 'cakes' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(0);
  });

  it('should handle missing data gracefully in subCategories', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce(null);
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(0);
  });

  it('should return full list if no categorySlug in subCategories', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(1);
  });

  it('should return methods list for Methods rootType', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce({
      methodsList: [
        {
          name: 'Baking',
          url: '/methods/baking',
          children: [{ name: 'Bread', url: '/methods/baking/bread' }],
        },
      ],
      categoriesList: [],
      holidays: [],
      specialDiets: [],
      bestRecipes: [],
      ingredients: [],
    });
    // need to recreate component to catch the new mock value for resource
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/methods' });
    paramsSubject.next({ category: 'baking' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(1);
    expect(component.subCategories()[0].name).toBe('Bread');
  });

  it('should return holidays list for Holidays rootType', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce({
      holidays: [
        {
          name: 'Christmas',
          url: '/holidays/christmas',
          children: [{ name: 'Dinner', url: '/holidays/christmas/dinner' }],
        },
      ],
      methodsList: [],
      categoriesList: [],
      specialDiets: [],
      bestRecipes: [],
      ingredients: [],
    });
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/holiday' });
    paramsSubject.next({ category: 'christmas' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(1);
  });

  it('should return special diets list for Special Diets rootType', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce({
      specialDiets: [
        {
          name: 'Vegan',
          url: '/special-diets/vegan',
          children: [{ name: 'Desserts', url: '/special-diets/vegan/desserts' }],
        },
      ],
      holidays: [],
      methodsList: [],
      categoriesList: [],
      bestRecipes: [],
      ingredients: [],
    });
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/special-diets' });
    paramsSubject.next({ category: 'vegan' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(1);
  });

  it('should return best recipes list for The Best Recipes rootType', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce({
      bestRecipes: [
        {
          name: 'Top 10',
          url: '/the-best-recipes/top-10',
          children: [{ name: 'Cakes', url: '/the-best-recipes/top-10/cakes' }],
        },
      ],
      specialDiets: [],
      holidays: [],
      methodsList: [],
      categoriesList: [],
      ingredients: [],
    });
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/the-best-recipes' });
    paramsSubject.next({ category: 'top-10' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(1);
  });

  it('should return ingredients list for Tags rootType', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce({
      ingredients: [
        {
          name: 'Chicken',
          url: '/tag/chicken',
          children: [{ name: 'Breast', url: '/tag/chicken/breast' }],
        },
      ],
      bestRecipes: [],
      specialDiets: [],
      holidays: [],
      methodsList: [],
      categoriesList: [],
    });
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/tag' });
    paramsSubject.next({ category: 'chicken' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(1);
  });

  it('should compute breadcrumbs with page > 1', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes/page/2' });
    paramsSubject.next({ page: '2' });
    fixture.detectChanges();
    await fixture.whenStable();
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[1].label).toBe('Recipes');
    expect(breadcrumbs[1].url).toBe('/recipes');
    expect(breadcrumbs[2].label).toBe('Page 2');
    expect(breadcrumbs[2].url).toBeUndefined();
  });

  it('should fall back to recipes method if url segments are empty', async () => {
    Object.defineProperty(router, 'url', { value: '/' });
    paramsSubject.next({ page: '2' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.displayTitle()).toBe('Recipes');
  });

  it('should handle category that does not exist in the list', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'nonexistent' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toHaveLength(0);
  });

  it('should return correct page URL', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.getPageUrl(1)).toBe('/recipes');
    expect(component.getPageUrl(3)).toBe('/recipes/page/3');
  });

  it('should return empty array if subcategories list is undefined/falsy', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce(
      {} as unknown as {
        categories?: unknown[];
        subcategories?: unknown[];
        specialDiets?: unknown[];
        holidays?: unknown[];
      },
    ); // empty object, lists undefined
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toEqual([]);
  });

  it('should hit the falsy tags branch when rootType returns an unknown type', async () => {
    vi.spyOn(component, 'rootType').mockReturnValue('UnknownType' as unknown as 'Recipes');
    paramsSubject.next({ category: 'desserts' });
    fixture.detectChanges();
    expect(component.subCategories()).toEqual([]);
  });

  it('should handle undefined lastItem in breadcrumb items when page > 1', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes/page/2' });

    const originalAt = Array.prototype.at;
    Array.prototype.at = vi.fn().mockReturnValue(undefined);

    try {
      paramsSubject.next({ page: '2' });
      fixture.detectChanges();
      await fixture.whenStable();
      const breadcrumbs = component.breadcrumbItems();
      expect(breadcrumbs).toHaveLength(3);
    } finally {
      Array.prototype.at = originalAt;
    }
  });

  it('should compute rootType correctly for holidays', async () => {
    Object.defineProperty(router, 'url', { value: '/holidays' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.rootType()).toBe('Holidays');
  });

  it('should match category using includes if endsWith fails', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce({
      categoriesList: [
        {
          name: 'Desserts',
          url: '/recipes/desserts/something-else',
          children: [{ name: 'Cakes', url: '/recipes/desserts/something-else/cakes' }],
        },
      ],
      methodsList: [],
      holidays: [],
      specialDiets: [],
      bestRecipes: [],
      ingredients: [],
    });
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'desserts' });
    fixture.detectChanges();
    await fixture.whenStable();
    const subcats = component.subCategories();
    expect(subcats).toHaveLength(1);
    expect(subcats[0].name).toBe('Cakes');
  });

  it('should return empty array if catSlug is present but list is undefined', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce(
      {} as unknown as {
        categoriesList: [];
        methodsList: [];
        holidays: [];
        specialDiets: [];
        bestRecipes: [];
        ingredients: [];
      },
    );
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'desserts' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toEqual([]);
  });

  it('should return empty array if current category has no children', async () => {
    recipeIndexServiceMock.getData.mockResolvedValueOnce({
      categoriesList: [
        {
          name: 'Desserts',
          url: '/recipes/desserts',
        },
      ],
      methodsList: [],
      holidays: [],
      specialDiets: [],
      bestRecipes: [],
      ingredients: [],
    });
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'desserts' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.subCategories()).toEqual([]);
  });

  it('should return empty recipes and 0 totalItems if resource value is falsy', async () => {
    recipeServiceMock.getRecipes.mockResolvedValueOnce(null);
    fixture = TestBed.createComponent(RecipeList);
    component = fixture.componentInstance;
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.recipes()).toEqual([]);
    expect(component.totalItems()).toBe(0);
    expect(component.totalPages()).toBe(0);
  });

  it('should unslugify category and subcategory in displayTitle', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'some-category' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.displayTitle()).toBe('Some Category');

    paramsSubject.next({ category: 'some-category', subcategory: 'some-sub-category' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.displayTitle()).toBe('Some Sub Category');
  });

  it('should compute breadcrumbs with category and page > 1', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes/desserts/page/2' });
    paramsSubject.next({ category: 'desserts', page: '2' });
    fixture.detectChanges();
    await fixture.whenStable();
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs).toHaveLength(4);
    expect(breadcrumbs[2].label).toBe('Desserts');
    expect(breadcrumbs[2].url).toBe('/recipes/desserts');
    expect(breadcrumbs[3].label).toBe('Page 2');
  });

  it('should call recipeService with correct parameters', async () => {
    Object.defineProperty(router, 'url', { value: '/recipes' });
    paramsSubject.next({ category: 'desserts', subcategory: 'cakes', page: '2' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(recipeServiceMock.getRecipes).toHaveBeenCalledWith(
      2,
      12,
      'recipes',
      'desserts',
      'cakes',
    );
  });

  it('should reflect isLoading state from resource', async () => {
    expect(component.isLoading()).toBe(false);
  });
});
