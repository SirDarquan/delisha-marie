import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Recipe, RecipeService } from './recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [RecipeService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', async () => {
    expect(service).toBeTruthy();
    // Read the signal to trigger the resource loader
    service.recipes();
    TestBed.flushEffects();
    const req = httpMock.expectOne('/api/recipes');
    req.flush({ items: [], total: 0 });
  });

  it('should fetch recipes', async () => {
    const mockRecipes = [
      {
        id: 1,
        title: 'Test Recipe',
        image: 'test.png',
        description: 'Test',
        prepTime: '10m',
        category: 'Testing',
        rating: 5,
        difficulty: 'Easy',
      },
    ];

    // Trigger loader
    service.recipes();
    TestBed.flushEffects();

    const req = httpMock.expectOne('/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush({ items: mockRecipes, total: mockRecipes.length });

    // Wait for the Promise from the mock response to resolve and update the resource
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.recipes()).toEqual(mockRecipes);
  });

  it('should fetch paginated recipes via getRecipes', async () => {
    const mockAllRecipes = [
      { id: 1, title: 'R1' } as unknown as Recipe,
      { id: 2, title: 'R2' } as unknown as Recipe,
      { id: 3, title: 'R3' } as unknown as Recipe,
    ];

    const promise = service.getRecipes(2, 2, 'baking', 'cakes', 'chocolate');

    const req = httpMock.expectOne(
      '/api/recipes?page=2&pageSize=2&method=baking&category=cakes&subcategory=chocolate&rating=',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockAllRecipes[2]], total: 3 });

    const result = await promise;
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(3);
  });

  it('should handle getRecipes with minimal parameters', async () => {
    const promise = service.getRecipes(1, 10, 'baking');
    const req = httpMock.expectOne(
      '/api/recipes?page=1&pageSize=10&method=baking&category=&subcategory=&rating=',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0 });
    const result = await promise;
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('should handle getRecipes with rating parameter', async () => {
    const promise = service.getRecipes(1, 10, 'baking', '', '', true);
    const req = httpMock.expectOne(
      '/api/recipes?page=1&pageSize=10&method=baking&category=&subcategory=&rating=true',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0 });
    await promise;
  });

  describe('getRecipeBySlug', () => {
    it('should find a recipe by slug', async () => {
      const mockRecipe = { id: 1, slug: 'test-recipe', title: 'Test' } as unknown as Recipe;

      const promise = service.getRecipeBySlug('test-recipe');

      const req = httpMock.expectOne('/api/recipes/test-recipe');
      req.flush(mockRecipe);

      const result = await promise;
      expect(result).toEqual(mockRecipe);
    });

    it('should normalize slugs for comparison', async () => {
      const mockRecipe = { id: 1, slug: '/recipe/test-recipe', title: 'Test' } as unknown as Recipe;

      // Test with leading slash and prefix
      const promise1 = service.getRecipeBySlug('test-recipe');
      const req1 = httpMock.expectOne('/api/recipes/test-recipe');
      req1.flush(mockRecipe);
      const result1 = await promise1;
      expect(result1).toEqual(mockRecipe);

      // Test with full slug
      (service as unknown as { recipeCache: Map<string, unknown> }).recipeCache.clear();
      const promise2 = service.getRecipeBySlug('/recipe/test-recipe');
      const req2 = httpMock.expectOne('/api/recipes/test-recipe');
      req2.flush(mockRecipe);
      const result2 = await promise2;
      expect(result2).toEqual(mockRecipe);
    });

    it('should return null if recipe not found', async () => {
      const promise = service.getRecipeBySlug('unknown');
      const req = httpMock.expectOne('/api/recipes/unknown');
      req.flush(null);
      const result = await promise;
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const promise = service.getRecipeBySlug('error');
      const req = httpMock.expectOne('/api/recipes/error');
      req.error(new ErrorEvent('Network error'));
      const result = await promise;
      expect(result).toBeNull();
    });

    it('should cache consecutive requests for the same slug and clear them after 5 seconds', async () => {
      vi.useFakeTimers();
      try {
        const mockRecipe = { id: 1, slug: 'cached-recipe', title: 'Cached' } as unknown as Recipe;

        // First request - goes to API
        const promise1 = service.getRecipeBySlug('cached-recipe');
        const req = httpMock.expectOne('/api/recipes/cached-recipe');
        req.flush(mockRecipe);
        const result1 = await promise1;
        expect(result1).toEqual(mockRecipe);

        // Second request - hits cache (no new API call)
        const promise2 = service.getRecipeBySlug('cached-recipe');
        httpMock.expectNone('/api/recipes/cached-recipe');
        const result2 = await promise2;
        expect(result2).toEqual(mockRecipe);

        // Advance timers by 5 seconds to trigger eviction
        vi.advanceTimersByTime(5000);

        // Third request - cache is cleared, should trigger new API call
        const promise3 = service.getRecipeBySlug('cached-recipe');
        const req2 = httpMock.expectOne('/api/recipes/cached-recipe');
        req2.flush(mockRecipe);
        const result3 = await promise3;
        expect(result3).toEqual(mockRecipe);
      } finally {
        vi.useRealTimers();
      }
    });
  });
  describe('comments', () => {
    it('should fetch comments for a recipe', async () => {
      const mockResponse = {
        comments: [{ id: 'c1', recipeId: '1', author: 'A', createdAt: new Date().toISOString() }],
        total: 1,
      };

      const promise = service.getComments('1');

      const req = httpMock.expectOne('/api/recipes/1/comments?page=');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].id).toBe('c1');
      expect(result.total).toBe(1);
    });

    it('should fetch comments for a recipe with a specific page', async () => {
      const promise = service.getComments('1', 2);
      const req = httpMock.expectOne('/api/recipes/1/comments?page=2');
      const mockResponse = { comments: [], total: 0 };
      req.flush(mockResponse);
      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should add a comment via POST request', async () => {
      const newCommentData = {
        recipeId: '1',
        author: 'Tester',
        email: 'test@example.com',
        content: 'Nice!',
      };

      const mockResponse = {
        ...newCommentData,
        id: 'new',
        createdAt: new Date().toISOString(),
      };

      const promise = service.addComment(newCommentData);

      const req = httpMock.expectOne('/api/recipes/1/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCommentData);
      req.flush(mockResponse);

      const result = await promise;
      expect(result.author).toBe('Tester');
      expect(result.id).toBe('new');
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('getRecipeEquipment', () => {
    it('should fetch equipment for a recipe', async () => {
      const mockEquipment = [{ id: 'e1', recipeId: '1', title: 'Pan', image: '', url: '' }];
      const promise = service.getRecipeEquipment('1');
      const req = httpMock.expectOne('/api/recipes/1/equipment');
      expect(req.request.method).toBe('GET');
      req.flush(mockEquipment);

      const result = await promise;
      expect(result).toEqual(mockEquipment);
    });
  });
});
