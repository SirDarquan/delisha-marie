import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { recipeListTitleResolver, recipeResolver, recipeTitleResolver } from './recipe.resolver';
import { Recipe, RecipeService } from '../services/recipe.service';
import { RecipeListService } from '../pages/recipe-list/recipe-list.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Recipe Resolvers', () => {
  let recipeListService: RecipeListService;
  let recipeService: RecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RecipeListService,
          useValue: { getTitle: vi.fn().mockReturnValue('Mock Title') },
        },
        {
          provide: RecipeService,
          useValue: { getRecipeBySlug: vi.fn().mockResolvedValue({ title: 'Mock Recipe' } as Recipe) },
        },
      ],
    });
    recipeListService = TestBed.inject(RecipeListService);
    recipeService = TestBed.inject(RecipeService);
  });

  describe('recipeListTitleResolver', () => {
    it('should call recipeListService.getTitle with correct parameters', () => {
      const route = {
        paramMap: {
          get: vi.fn().mockImplementation((key) => {
            if (key === 'category') return 'test-cat';
            if (key === 'subcategory') return 'test-sub';
            if (key === 'page') return '2';
            return null;
          }),
        },
        routeConfig: { path: 'recipes/:category/:subcategory' },
      } as unknown as ActivatedRouteSnapshot;

      const result = TestBed.runInInjectionContext(() => {
        return recipeListTitleResolver(route, {} as any);
      });

      expect(recipeListService.getTitle).toHaveBeenCalledWith({
        url: 'recipes',
        category: 'test-cat',
        subCategory: 'test-sub',
        page: '2',
      });
      expect(result).toBe('Mock Title');
    });
  });

  describe('recipeResolver', () => {
    it('should call recipeService.getRecipeBySlug', async () => {
      const route = {
        paramMap: { get: vi.fn().mockReturnValue('test-slug') },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return recipeResolver(route, {} as any);
      });

      expect(recipeService.getRecipeBySlug).toHaveBeenCalledWith('test-slug');
      expect(result).toEqual({ title: 'Mock Recipe' });
    });

    it('should return null if no slug', async () => {
      const route = {
        paramMap: { get: vi.fn().mockReturnValue(null) },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return recipeResolver(route, {} as any);
      });

      expect(result).toBeNull();
    });
  });

  describe('recipeTitleResolver', () => {
    it('should return recipe title', async () => {
      const route = {
        paramMap: { get: vi.fn().mockReturnValue('test-slug') },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return recipeTitleResolver(route, {} as any);
      });

      expect(result).toBe('Mock Recipe');
    });

    it('should return default title if no slug', async () => {
      const route = {
        paramMap: { get: vi.fn().mockReturnValue(null) },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return recipeTitleResolver(route, {} as any);
      });

      expect(result).toBe('Recipe');
    });
  });
});
