import { APP_BASE_HREF, DOCUMENT, PathLocationStrategy } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { Recipe, RecipeService } from '../services/recipe.service';
import { createMockRecipe } from '../utils/test-recipe';
import {
  convertToIso8601Duration,
  generateArticleSchema,
  generateRecipeSchema,
  getRecipeBreadcrumbs,
  schemaRecipeResolver,
} from './recipe-schema.resolver';

describe('recipe-schema.resolver', () => {
  let mockDocument: {
    location: { origin: string };
    createElement: Mock;
    head: { appendChild: Mock };
    querySelector: Mock;
  };
  let recipeService: RecipeService;

  beforeEach(() => {
    mockDocument = {
      location: { origin: 'http://localhost:4200' },
      createElement: vi.fn().mockReturnValue({ setAttribute: vi.fn() }),
      head: { appendChild: vi.fn() },
      querySelector: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: APP_BASE_HREF, useValue: '/' },
        {
          provide: RecipeService,
          useValue: {
            getSchemaBySlug: vi.fn().mockResolvedValue(null),
            getTopComments: vi.fn().mockResolvedValue([]),
          },
        },
      ],
    });
    recipeService = TestBed.inject(RecipeService);
  });

  describe('schemaRecipeResolver', () => {
    it('should return recipe schema array and fetch top comments when comments are empty', async () => {
      const mockRecipe: Recipe = createMockRecipe({
        title: 'Recipe',
        slug: 'recipe',
        description: 'Desc',
        image: '/img.jpg',
        category: 'Cat',
        prepTime: '1 day',
        cookTime: '2 hours 30 mins',
        totalTime: '1 day 2 hours 30 mins',
        difficulty: 'Easy',
        author: 'Author',
        ingredients: ['Ing1'],
        instructions: ['Step1'],
        comments: [],
      });

      vi.mocked(recipeService.getSchemaBySlug).mockResolvedValue(mockRecipe);
      vi.mocked(recipeService.getTopComments).mockResolvedValue([
        {
          id: 'c1',
          recipeId: 'recipe',
          author: 'Commenter',
          email: 'c@test.com',
          content: 'Great!',
          createdAt: '2026-01-01',
        },
      ]);

      const route = {
        paramMap: { get: () => 'recipe' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/recipe?preview=123#top' } as RouterStateSnapshot;

      const result = (await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, state),
      )) as Record<string, unknown>[];

      expect(recipeService.getSchemaBySlug).toHaveBeenCalledWith('recipe');
      expect(recipeService.getTopComments).toHaveBeenCalledWith('recipe');
      expect(result).toHaveLength(8);
      const recipeSchema = result.find((s) => s['@type'] === 'Recipe') as Record<string, unknown>;
      expect(recipeSchema).toBeDefined();
      expect(recipeSchema['prepTime']).toBe('PT1440M');
      expect(recipeSchema['cookTime']).toBe('PT150M');
      expect(recipeSchema['totalTime']).toBe('PT1590M');
      const reviews = recipeSchema['review'] as Record<string, unknown>[];
      expect(reviews).toHaveLength(1);
      expect(reviews[0]['reviewRating']).toBeUndefined();
    });

    it('should not call getTopComments when recipe already has comments with ratings', async () => {
      const mockRecipe: Recipe = createMockRecipe({
        title: 'Recipe',
        slug: 'recipe',
        description: 'Desc',
        image: '/img.jpg',
        prepTime: 'unknown',
        cookTime: '',
        totalTime: '10 mins',
        author: 'Author',
        keywords: undefined,
        course: undefined,
        rating: undefined,
        ratingCount: undefined,
        reviewCount: undefined,
        video: 'dQw4w9WgXcQ',
        comments: [
          {
            id: '1',
            recipeId: 'recipe',
            author: 'User',
            email: 'user@test.com',
            content: 'Good',
            rating: 5,
            createdAt: '2026-01-01',
          },
        ],
      });

      vi.mocked(recipeService.getSchemaBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'recipe' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/recipe' } as RouterStateSnapshot;

      const result = (await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, state),
      )) as Record<string, unknown>[];

      expect(recipeService.getTopComments).not.toHaveBeenCalled();
      const articleSchema = result.find((s) => s['@type'] === 'Article') as Record<string, unknown>;
      expect(articleSchema['keywords']).toEqual([]);
      expect(articleSchema['articleSection']).toEqual(['Recipe']);

      const recipeSchema = result.find((s) => s['@type'] === 'Recipe') as Record<string, unknown>;
      const reviews = recipeSchema['review'] as Record<string, unknown>[];
      expect(reviews[0]['reviewRating']).toEqual({
        '@type': 'Rating',
        ratingValue: 5,
      });
      const videoObj = recipeSchema['video'] as Record<string, unknown>;
      expect(videoObj['@type']).toBe('VideoObject');
    });

    it('should return empty array when slug is missing', async () => {
      const route = {
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, {} as RouterStateSnapshot),
      );
      expect(result).toEqual([]);
    });

    it('should return empty array when backend returns null (e.g. scheduled preview or missing recipe)', async () => {
      vi.mocked(recipeService.getSchemaBySlug).mockResolvedValue(null);
      const route = {
        paramMap: { get: () => 'scheduled-recipe' },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, {
          url: '/recipe/scheduled-recipe?preview=tok',
        } as RouterStateSnapshot),
      );
      expect(result).toEqual([]);
    });

    it('should use non-root baseHref from PathLocationStrategy', async () => {
      const spy = vi
        .spyOn(PathLocationStrategy.prototype, 'getBaseHref')
        .mockReturnValue('/kitchen/');

      const mockRecipe = createMockRecipe({
        title: 'Recipe BaseHref',
        slug: 'recipe-basehref',
        description: 'Desc',
      });
      vi.mocked(recipeService.getSchemaBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'recipe-basehref' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/recipe-basehref' } as RouterStateSnapshot;

      const result = (await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, state),
      )) as Record<string, unknown>[];
      expect(result).toHaveLength(8);
      spy.mockRestore();
    });
  });

  describe('Helper Functions', () => {
    it('getRecipeBreadcrumbs should return main trail or empty array when missing', () => {
      const withTrail = createMockRecipe({
        breadcrumbs: {
          main: 0,
          items: [[{ label: 'Home', url: '/' }]],
        },
      });
      expect(getRecipeBreadcrumbs(withTrail)).toEqual([{ label: 'Home', url: '/' }]);

      const withoutBreadcrumbs = createMockRecipe({ breadcrumbs: undefined });
      expect(getRecipeBreadcrumbs(withoutBreadcrumbs)).toEqual([]);
    });

    it('generateArticleSchema and generateRecipeSchema should handle optional nutrition and instructions', () => {
      const minimalRecipe = createMockRecipe({
        content: '<p>Hello world</p>',
        instructions: undefined,
        nutrition: undefined,
        comments: undefined,
      });

      const article = generateArticleSchema(
        minimalRecipe,
        'http://localhost:4200/recipe/test',
        'http://localhost:4200/img.jpg',
        ['k1'],
        ['Dessert'],
      );
      expect(article['wordCount']).toBe(2);

      const recipeSchema = generateRecipeSchema(
        minimalRecipe,
        'http://localhost:4200/recipe/test',
        'http://localhost:4200/img.jpg',
      );
      expect(recipeSchema['recipeInstructions']).toBeUndefined();
    });

    it('convertToIso8601Duration should parse days, hours, minutes, and return empty string for invalid duration', () => {
      expect(convertToIso8601Duration('')).toBe('');
      expect(convertToIso8601Duration('invalid')).toBe('');
      expect(convertToIso8601Duration('1 day 2 hrs 15 mins')).toBe('PT1575M');
    });
  });
});
