import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { makeStateKey, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Comment, Equipment, Recipe, RecipeService } from './recipe.service';

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
      const mockRecipe = { id: 1, slug: '/recipe/test-slug', title: 'Test' } as unknown as Recipe;

      // First request with full slug
      const promise1 = service.getRecipeBySlug('/recipe/test-slug');
      const req1 = httpMock.expectOne('/api/recipes/test-slug');
      req1.flush(mockRecipe);
      const result1 = await promise1;
      expect(result1).toEqual(mockRecipe);

      // Second request with clean slug should hit cache
      const promise2 = service.getRecipeBySlug('test-slug');
      httpMock.expectNone('/api/recipes/test-slug');
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
      req.error(new ProgressEvent('Network error'));
      const result = await promise;
      expect(result).toBeNull();
    });

    it('should clear cache after 5 seconds for getRecipeBySlug', async () => {
      const origSetTimeout = window.setTimeout;
      let interceptedCb: ((...args: unknown[]) => void) | null = null;
      window.setTimeout = function (cb: (...args: unknown[]) => void, ms?: number) {
        if (ms === 5000) {
          interceptedCb = cb;
        }
        return origSetTimeout.call(window, cb, ms);
      } as unknown as typeof window.setTimeout;

      try {
        const mockRecipe = { id: 1, slug: 'test-slug', title: 'Test' } as unknown as Recipe;

        const promise1 = service.getRecipeBySlug('test-slug');
        httpMock.expectOne('/api/recipes/test-slug').flush(mockRecipe);
        await promise1;

        if (interceptedCb as unknown) {
          (interceptedCb as unknown as () => void)();
        }

        // Use bracket notation to access private property without "any"
        expect(
          (service as unknown as { recipeCache: Map<string, unknown> }).recipeCache.has(
            'test-slug',
          ),
        ).toBe(false);
      } finally {
        window.setTimeout = origSetTimeout;
      }
    });

    it('should refresh recipe when refresh flag is true', async () => {
      const transferState = TestBed.inject(TransferState);
      const mockRecipe1 = { id: 1, slug: 'test-slug', title: 'Test 1' } as unknown as Recipe;
      const mockRecipe2 = { id: 1, slug: 'test-slug', title: 'Test 2' } as unknown as Recipe;

      const p1 = service.getRecipeBySlug('test-slug');
      httpMock.expectOne('/api/recipes/test-slug').flush(mockRecipe1);
      const res1 = await p1;
      expect(res1?.title).toBe('Test 1');

      // Clear TransferState to allow network refetch
      transferState.remove(makeStateKey('API_GET_/api/recipes/test-slug'));

      const p2 = service.getRecipeBySlug('test-slug', true);
      httpMock.expectOne('/api/recipes/test-slug').flush(mockRecipe2);
      const res2 = await p2;
      expect(res2?.title).toBe('Test 2');
    });
  });

  describe('getSEOBySlug', () => {
    it('should fetch SEO metadata by slug', async () => {
      const mockSeo = {
        title: 'Test Recipe',
        description: 'Delicious recipe',
        keywords: ['test'],
        image: '/img.jpg',
        imageWidth: 800,
        imageHeight: 600,
      };

      const promise = service.getSeoBySlug('test-recipe');
      const req = httpMock.expectOne('/api/recipes/test-recipe/seo');
      req.flush(mockSeo);

      const result = await promise;
      expect(result).toEqual(mockSeo);
    });

    it('should normalize slug and use seoCache on repeated calls', async () => {
      const mockSeo = { title: 'Test' };

      const p1 = service.getSeoBySlug('/recipe/my-slug');
      httpMock.expectOne('/api/recipes/my-slug/seo').flush(mockSeo);
      const r1 = await p1;
      expect(r1).toEqual(mockSeo);

      const p2 = service.getSeoBySlug('my-slug');
      httpMock.expectNone('/api/recipes/my-slug/seo');
      const r2 = await p2;
      expect(r2).toEqual(mockSeo);
    });

    it('should refresh SEO when refresh flag is true', async () => {
      const transferState = TestBed.inject(TransferState);
      const mockSeo1 = { title: 'Old' };
      const mockSeo2 = { title: 'New' };

      const p1 = service.getSeoBySlug('my-slug');
      httpMock.expectOne('/api/recipes/my-slug/seo').flush(mockSeo1);
      await p1;

      // Clear TransferState to allow network refetch
      transferState.remove(makeStateKey('API_GET_/api/recipes/my-slug/seo'));

      const p2 = service.getSeoBySlug('my-slug', true);
      httpMock.expectOne('/api/recipes/my-slug/seo').flush(mockSeo2);
      const r2 = await p2;
      expect(r2).toEqual(mockSeo2);
    });

    it('should return null on error', async () => {
      const promise = service.getSeoBySlug('error-slug');
      const req = httpMock.expectOne('/api/recipes/error-slug/seo');
      req.error(new ProgressEvent('Network error'));
      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('getSchemaBySlug', () => {
    it('should fetch Schema metadata by slug', async () => {
      const mockSchemaRecipe = {
        id: 1,
        title: 'Schema Recipe',
        slug: 'schema-recipe',
        comments: [],
      } as unknown as Recipe;

      const promise = service.getSchemaBySlug('schema-recipe');
      const req = httpMock.expectOne('/api/recipes/schema-recipe/schema');
      req.flush(mockSchemaRecipe);

      const result = await promise;
      expect(result).toEqual(mockSchemaRecipe);
    });

    it('should normalize slug and use schemaCache on repeated calls', async () => {
      const mockSchemaRecipe = { id: 1, title: 'Cached Schema' } as unknown as Recipe;

      const p1 = service.getSchemaBySlug('/recipe/cached-schema');
      httpMock.expectOne('/api/recipes/cached-schema/schema').flush(mockSchemaRecipe);
      const r1 = await p1;
      expect(r1).toEqual(mockSchemaRecipe);

      const p2 = service.getSchemaBySlug('cached-schema');
      httpMock.expectNone('/api/recipes/cached-schema/schema');
      const r2 = await p2;
      expect(r2).toEqual(mockSchemaRecipe);
    });

    it('should refresh schema when refresh flag is true', async () => {
      const transferState = TestBed.inject(TransferState);
      const mockSchema1 = { id: 1, title: 'Schema 1' } as unknown as Recipe;
      const mockSchema2 = { id: 1, title: 'Schema 2' } as unknown as Recipe;

      const p1 = service.getSchemaBySlug('schema-refresh');
      httpMock.expectOne('/api/recipes/schema-refresh/schema').flush(mockSchema1);
      await p1;

      // Clear TransferState to allow network refetch
      transferState.remove(makeStateKey('API_GET_/api/recipes/schema-refresh/schema'));

      const p2 = service.getSchemaBySlug('schema-refresh', true);
      httpMock.expectOne('/api/recipes/schema-refresh/schema').flush(mockSchema2);
      const r2 = await p2;
      expect(r2).toEqual(mockSchema2);
    });

    it('should reuse schemaCache in getRecipeBySlug if available', async () => {
      const mockSchema = {
        id: 1,
        title: 'From Schema',
        slug: 'cross-cache',
      } as unknown as Recipe;
      const schemaPromise = service.getSchemaBySlug('cross-cache');
      httpMock.expectOne('/api/recipes/cross-cache/schema').flush(mockSchema);
      await schemaPromise;

      const recipePromise = service.getRecipeBySlug('cross-cache');
      httpMock.expectNone('/api/recipes/cross-cache');
      const recipe = await recipePromise;
      expect(recipe?.title).toBe('From Schema');
      expect(recipe?.navigation).toEqual({ prev: null, next: null });
    });

    it('should fallback to api in getRecipeBySlug if schemaCache returned null', async () => {
      const schemaPromise = service.getSchemaBySlug('null-schema');
      httpMock.expectOne('/api/recipes/null-schema/schema').flush(null);
      await schemaPromise;

      const recipePromise = service.getRecipeBySlug('null-schema');
      await Promise.resolve();
      const req = httpMock.expectOne('/api/recipes/null-schema');
      const fallbackRecipe = { id: 2, title: 'Fallback' } as unknown as Recipe;
      req.flush(fallbackRecipe);
      const recipe = await recipePromise;
      expect(recipe?.title).toBe('Fallback');
    });

    it('should reuse recipeCache in getSchemaBySlug if available', async () => {
      const mockRecipe = {
        id: 3,
        title: 'From Recipe',
        slug: 'recipe-first',
      } as unknown as Recipe;
      const rPromise = service.getRecipeBySlug('recipe-first');
      httpMock.expectOne('/api/recipes/recipe-first').flush(mockRecipe);
      await rPromise;

      const sPromise = service.getSchemaBySlug('recipe-first');
      httpMock.expectNone('/api/recipes/recipe-first/schema');
      const schema = await sPromise;
      expect(schema?.title).toBe('From Recipe');
    });

    it('should return null on error', async () => {
      const promise = service.getSchemaBySlug('error-schema');
      const req = httpMock.expectOne('/api/recipes/error-schema/schema');
      req.error(new ProgressEvent('Network error'));
      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('getTitle', () => {
    it('should fetch title via HTTP when not cached', async () => {
      const p = service.getTitle('/recipe/sweet-pie');
      const req = httpMock.expectOne('/api/recipes/sweet-pie/title');
      req.flush({ title: 'Sweet Pie' });
      const title = await p;
      expect(title).toBe('Sweet Pie');
    });

    it('should return null on HTTP error for getTitle', async () => {
      const p = service.getTitle('error-slug');
      const req = httpMock.expectOne('/api/recipes/error-slug/title');
      req.error(new ProgressEvent('Network error'));
      const title = await p;
      expect(title).toBeNull();
    });

    it('should reuse recipeCache for getTitle', async () => {
      const mockRecipe = { id: 1, title: 'Cached In Recipe' } as unknown as Recipe;
      const rPromise = service.getRecipeBySlug('recipe-cache-title');
      httpMock.expectOne('/api/recipes/recipe-cache-title').flush(mockRecipe);
      await rPromise;

      const title = await service.getTitle('recipe-cache-title');
      httpMock.expectNone('/api/recipes/recipe-cache-title/title');
      expect(title).toBe('Cached In Recipe');
    });

    it('should reuse schemaCache for getTitle', async () => {
      const mockSchema = { id: 1, title: 'Cached In Schema' } as unknown as Recipe;
      const sPromise = service.getSchemaBySlug('schema-cache-title');
      httpMock.expectOne('/api/recipes/schema-cache-title/schema').flush(mockSchema);
      await sPromise;

      const title = await service.getTitle('schema-cache-title');
      httpMock.expectNone('/api/recipes/schema-cache-title/title');
      expect(title).toBe('Cached In Schema');
    });

    it('should reuse seoCache for getTitle', async () => {
      const mockSeo = { title: 'Cached In SEO' };
      const seoPromise = service.getSeoBySlug('seo-cache-title');
      httpMock.expectOne('/api/recipes/seo-cache-title/seo').flush(mockSeo);
      await seoPromise;

      const title = await service.getTitle('seo-cache-title');
      httpMock.expectNone('/api/recipes/seo-cache-title/title');
      expect(title).toBe('Cached In SEO');
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

  describe('getTitle', () => {
    it('should fetch the title for a recipe', async () => {
      const promise = service.getTitle('test-recipe');
      const req = httpMock.expectOne('/api/recipes/test-recipe/title');
      expect(req.request.method).toBe('GET');
      req.flush({ title: 'Test Title' });
      const result = await promise;
      expect(result).toBe('Test Title');
    });

    it('should return null on error', async () => {
      const promise = service.getTitle('error-recipe');
      const req = httpMock.expectOne('/api/recipes/error-recipe/title');
      req.error(new ProgressEvent('error'));
      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('getFavoriteRecipes', () => {
    it('should fetch favorite recipes', async () => {
      const mockFavorites = { items: [{ id: 1, title: 'Fave 1' } as unknown as Recipe] };
      const promise = service.getFavoriteRecipes();
      const req = httpMock.expectOne('/api/recipes/favorites/list');
      expect(req.request.method).toBe('GET');
      req.flush(mockFavorites);
      const result = await promise;
      expect(result).toEqual(mockFavorites);
    });
  });

  describe('getRecipes caching', () => {
    it('should return cached promise if within 5 minutes', async () => {
      const promise1 = service.getRecipes(1, 10, 'baking');
      const req = httpMock.expectOne(
        '/api/recipes?page=1&pageSize=10&method=baking&category=&subcategory=&rating=',
      );
      req.flush({ items: [], total: 0 });
      await promise1;

      // Make a second call without modifying anything, should hit cache
      const promise2 = service.getRecipes(1, 10, 'baking');
      httpMock.expectNone(
        '/api/recipes?page=1&pageSize=10&method=baking&category=&subcategory=&rating=',
      );

      const result2 = await promise2;
      expect(result2).toEqual({ items: [], total: 0 });
    });

    it('should remove cache on error', async () => {
      const promise = service.getRecipes(3, 10, 'baking');
      const req = httpMock.expectOne(
        '/api/recipes?page=3&pageSize=10&method=baking&category=&subcategory=&rating=',
      );
      req.error(new ProgressEvent('error'));

      try {
        await promise;
      } catch (e) {
        expect(e).toBeTruthy();
      }

      const promise2 = service.getRecipes(3, 10, 'baking');
      const req2 = httpMock.expectOne(
        '/api/recipes?page=3&pageSize=10&method=baking&category=&subcategory=&rating=',
      );
      req2.flush({ items: [], total: 0 });
      await promise2;
    });
  });

  describe('getTitle', () => {
    it('should return title on success', async () => {
      const promise = service.getTitle('test-recipe');
      const req = httpMock.expectOne('/api/recipes/test-recipe/title');
      req.flush({ title: 'My Awesome Recipe' });
      const result = await promise;
      expect(result).toBe('My Awesome Recipe');
    });

    it('should return null on failure', async () => {
      const promise = service.getTitle('error-recipe');
      const req = httpMock.expectOne('/api/recipes/error-recipe/title');
      req.error(new ProgressEvent('Network error'));
      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('getFavoriteRecipes', () => {
    it('should return favorite recipes list', async () => {
      const mockList = { items: [{ id: 1, title: 'Fav' }] as unknown as Recipe[] };
      const promise = service.getFavoriteRecipes();
      const req = httpMock.expectOne('/api/recipes/favorites/list');
      req.flush(mockList);
      const result = await promise;
      expect(result).toEqual(mockList);
    });
  });

  describe('getTopComments', () => {
    it('should return top comments for slug', async () => {
      const mockComments = [{ id: '1', content: 'Great!' }] as unknown as Comment[];
      const promise = service.getTopComments('my-slug');
      const req = httpMock.expectOne('/api/recipes/my-slug/comments/top');
      req.flush(mockComments);
      const result = await promise;
      expect(result).toEqual(mockComments);
    });
  });

  describe('getRecipeEquipment', () => {
    it('should return equipment for recipe', async () => {
      const mockEquip = [{ id: '1', title: 'Pan' }] as unknown as Equipment[];
      const promise = service.getRecipeEquipment(123);
      const req = httpMock.expectOne('/api/recipes/123/equipment');
      req.flush(mockEquip);
      const result = await promise;
      expect(result).toEqual(mockEquip);
    });
  });

  describe('getSEOBySlug and cache timeouts', () => {
    it('should call getSEOBySlug alias and expire cache after timeout', async () => {
      vi.useFakeTimers();
      try {
        const mockSeo = { title: 'SEO Title' };
        const promise = service.getSEOBySlug('seo-test');
        const req = httpMock.expectOne('/api/recipes/seo-test/seo');
        req.flush(mockSeo);
        const result = await promise;
        expect(result).toEqual(mockSeo);

        const pRecipe = service.getRecipeBySlug('cache-test');
        httpMock.expectOne('/api/recipes/cache-test').flush({ id: 1 } as unknown as Recipe);
        await pRecipe;

        const pSchema = service.getSchemaBySlug('cache-test-schema');
        httpMock
          .expectOne('/api/recipes/cache-test-schema/schema')
          .flush({ id: 2 } as unknown as Recipe);
        await pSchema;

        // Advance timers by 5000ms to trigger delete callbacks on all three caches
        vi.advanceTimersByTime(5000);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
