import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { recipeListTitleResolver } from './title.resolver';
import { RecipeListService } from '../pages/recipe-list/recipe-list.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('recipeListTitleResolver', () => {
  let recipeListService: RecipeListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RecipeListService,
          useValue: { getTitle: vi.fn().mockReturnValue('Mock Title') },
        },
      ],
    });
    recipeListService = TestBed.inject(RecipeListService);
  });

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

  it('should handle missing parameters', () => {
    const route = {
      paramMap: { get: vi.fn().mockReturnValue(null) },
      routeConfig: { path: 'recipes' },
    } as unknown as ActivatedRouteSnapshot;

    TestBed.runInInjectionContext(() => {
      recipeListTitleResolver(route, {} as any);
    });

    expect(recipeListService.getTitle).toHaveBeenCalledWith({
      url: 'recipes',
      category: undefined,
      subCategory: undefined,
      page: undefined,
    });
  });

  it('should handle missing routeConfig path', () => {
    const route = {
      paramMap: { get: vi.fn().mockReturnValue(null) },
      routeConfig: {}, // No path
    } as unknown as ActivatedRouteSnapshot;

    TestBed.runInInjectionContext(() => {
      recipeListTitleResolver(route, {} as any);
    });

    expect(recipeListService.getTitle).toHaveBeenCalledWith(
      expect.objectContaining({ url: '' })
    );
  });
});
