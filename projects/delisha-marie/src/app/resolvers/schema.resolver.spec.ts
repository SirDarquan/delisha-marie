import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { Recipe, RecipeService } from '../services/recipe.service';
import { createMockRecipe } from '../utils/test-recipe';
import {
  generateAboutPageSchema,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateContactPageSchema,
  generateFAQPageSchema,
  generateImageObjectSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateWebPageSchema,
  generateWebSiteSchema,
  getRecipeBreadcrumbs,
  schemaRecipeResolver,
  schemaResolver,
} from './schema.resolver';

describe('schemaResolver', () => {
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
        {
          provide: RecipeService,
          useValue: { getRecipeBySlug: vi.fn().mockResolvedValue(null) },
        },
      ],
    });
    recipeService = TestBed.inject(RecipeService);
  });

  describe('Utility Functions', () => {
    it('generateOrganizationSchema', () => {
      const result = generateOrganizationSchema('url/', 'name', 'logo.png', '100', '100');
      expect(result['@type']).toBe('Organization');
      expect(result['name']).toBe('name');
    });

    it('generateWebSiteSchema', () => {
      const result = generateWebSiteSchema('url/', 'site');
      expect(result['@type']).toBe('WebSite');
      expect(result['name']).toBe('site');
    });

    it('generateCollectionPageSchema', () => {
      const result = generateCollectionPageSchema('url/', 'name', 'desc');
      expect(result['@type']).toBe('CollectionPage');
      expect(result['name']).toBe('name');
    });

    it('generateAboutPageSchema', () => {
      const result = generateAboutPageSchema('url/', 'name', 'desc');
      expect(result['@type']).toBe('AboutPage');
      expect(result['name']).toBe('name');
    });

    it('generateContactPageSchema', () => {
      const result = generateContactPageSchema('url/', 'name', 'desc');
      expect(result['@type']).toBe('ContactPage');
      expect(result['name']).toBe('name');
    });

    it('generateFAQPageSchema', () => {
      const result = generateFAQPageSchema('url/', 'name', [{ question: 'Q', answer: 'A' }]);
      expect(result['@type']).toBe('FAQPage');
      expect((result['mainEntity'] as Record<string, unknown>[])[0]['name']).toBe('Q');
    });

    it('generateWebPageSchema', () => {
      const result = generateWebPageSchema('url/', 'slug', 'name', 'desc', 'thumb', 'date');
      expect(result['@type']).toBe('WebPage');
      expect(result['name']).toBe('name');
    });

    it('generateBreadcrumbSchema', () => {
      const result = generateBreadcrumbSchema(
        [{ label: 'Home', url: '/' }],
        'http://base.com/',
        'slug',
      );
      expect(result['@type']).toBe('BreadcrumbList');
      expect((result['itemListElement'] as Record<string, unknown>[])[0]['name']).toBe('Home');
    });

    it('getRecipeBreadcrumbs - should return main trail breadcrumbs from recipe', () => {
      const recipe: Recipe = createMockRecipe({
        breadcrumbs: {
          main: 1,
          items: [
            [{ label: 'Home', url: '/' }],
            [
              { label: 'Home', url: '/' },
              { label: 'The Best', url: '/the-best' },
            ],
          ],
        },
      });
      const result = getRecipeBreadcrumbs(recipe);

      const labels = result.map((b) => b.label);
      expect(labels).toContain('The Best');
    });

    it('generatePersonSchema', () => {
      const result = generatePersonSchema('url', 'name');
      expect(result['@type']).toBe('Person');
      expect(result['name']).toBe('name');
    });

    it('generateImageObjectSchema', () => {
      const result = generateImageObjectSchema('url', 'slug', 'imageUrl', 'caption');
      expect(result['@type']).toBe('ImageObject');
      expect(result['url']).toBe('imageUrl');
    });
  });
  describe('Resolver logic', () => {
    it('should return schema array and append script for generic page', () => {
      const route = {
        data: { description: 'desc' },
        paramMap: { get: () => '' },
      } as unknown as ActivatedRouteSnapshot;

      const state = { url: '/some-page' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => schemaResolver(route, state)) as Record<
        string,
        unknown
      >[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4); // Org, WebSite, WebPage, Breadcrumb
      expect(mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(result.some((s) => s['@type'] === 'WebPage')).toBe(true);
    });

    it('should return specific schemas for specific pages', () => {
      const pages = [
        { url: '/recipes', type: 'CollectionPage' },
        { url: '/methods/baking', type: 'CollectionPage' },
        { url: '/holidays/christmas', type: 'CollectionPage' },
        { url: '/special-diets/vegan', type: 'CollectionPage' },
        { url: '/tag/chicken', type: 'CollectionPage' },
        { url: '/the-best-recipes', type: 'CollectionPage' },
        { url: '/about', type: 'AboutPage' },
        { url: '/contact', type: 'ContactPage' },
      ];

      for (const page of pages) {
        const route = {
          data: { description: 'desc' },
          paramMap: { get: () => '' },
        } as unknown as ActivatedRouteSnapshot;

        const state = { url: page.url } as RouterStateSnapshot;

        const result = TestBed.runInInjectionContext(() => schemaResolver(route, state)) as Record<
          string,
          unknown
        >[];

        const hasSpecificSchema = result.some((s) => s['@type'] === page.type);
        expect(hasSpecificSchema).toBe(true);
      }
    });

    it('should reuse existing script tag if one is present', () => {
      const existingScript = { setAttribute: vi.fn() };
      mockDocument.querySelector = vi.fn().mockReturnValue(existingScript);

      const route = {
        data: { description: 'desc' },
        paramMap: { get: () => '' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/some-page' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => schemaResolver(route, state));

      // Should not create a new one
      expect(mockDocument.createElement).not.toHaveBeenCalled();
      // Should modify the existing one
      expect((existingScript as unknown as HTMLScriptElement).textContent).toContain('@context');
    });

    it('should handle paginated URLs in getBaseBreadcrumbs', () => {
      const route = {
        data: { description: 'desc' },
        paramMap: { get: () => '' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipes/page/2' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => schemaResolver(route, state)) as Record<
        string,
        unknown
      >[];
      expect(result).toBeDefined();
    });
  });

  describe('schemaRecipeResolver', () => {
    it('should return recipe schema array', async () => {
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
      });

      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'recipe' },
        queryParamMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/recipe' } as RouterStateSnapshot;

      const result = (await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, state),
      )) as Record<string, unknown>[];

      expect(recipeService.getRecipeBySlug).toHaveBeenCalledWith('recipe');
      expect(result.length).toBe(8); // Org, Person, WebSite, Image, WebPage, Article, Recipe, Breadcrumb
      const recipeSchema = result.find((s) => s['@type'] === 'Recipe') as Record<string, string>;
      expect(recipeSchema).toBeDefined();
      expect(recipeSchema['prepTime']).toBe('PT1440M');
      expect(recipeSchema['cookTime']).toBe('PT150M');
      expect(recipeSchema['totalTime']).toBe('PT1590M');
    });

    it('should handle subcategory and comments in recipe schema', async () => {
      const mockRecipe: Recipe = createMockRecipe({
        title: 'Recipe',
        slug: 'recipe',
        description: 'Desc',
        image: '/img.jpg',
        category: 'Cat',
        prepTime: 'unknown',
        cookTime: '',
        totalTime: '10 mins',
        difficulty: 'Easy',
        author: 'Author',
        ingredients: ['Ing1'],
        instructions: ['Step1'],
        breadcrumbs: {
          main: 0,
          items: [
            [
              { label: 'Home', url: '/' },
              { label: 'Recipes', url: '/recipes' },
              { label: 'Desserts', url: '/recipes/desserts' },
              { label: 'Sub', url: '/recipes/desserts/sub' },
              { label: 'Recipe' },
            ],
          ],
        },
        comments: [
          {
            id: '1',
            recipeId: 'recipe',
            author: 'User',
            email: 'user@test.com',
            content: 'Good',
            rating: 5,
            createdAt: '2023-01-01',
          },
        ],
      });

      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'recipe' },
        queryParamMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/recipe' } as RouterStateSnapshot;

      const result = (await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, state),
      )) as Record<string, unknown>[];

      const recipeSchema = result.find((s) => s['@type'] === 'Recipe') as Record<string, unknown>;
      expect(recipeSchema['prepTime']).toBe(''); // From 'unknown' (line 703)
      expect(recipeSchema['cookTime']).toBe(''); // From '' (line 675)
      expect(recipeSchema['review']).toBeDefined();
      expect(Array.isArray(recipeSchema['review'])).toBe(true);
      expect((recipeSchema['review'] as unknown[]).length).toBe(1);

      const breadcrumbSchema = result.find((s) => s['@type'] === 'BreadcrumbList') as Record<
        string,
        unknown
      >;
      const items = breadcrumbSchema['itemListElement'] as { name: string }[];
      expect(items.some((i) => i.name === 'Sub')).toBe(true);
    });

    it('generateBreadcrumbSchema - should handle breadcrumbs without URLs', () => {
      const result = generateBreadcrumbSchema(
        [{ label: 'Home' }], // No URL
        'http://base.com/',
        'slug',
      );
      expect((result['itemListElement'] as { item: unknown }[])[0].item).toBeUndefined();
    });

    it('should return empty array if slug missing', async () => {
      const route = {
        paramMap: { get: () => null },
        queryParamMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, {} as RouterStateSnapshot),
      );
      expect(result).toEqual([]);
    });

    it('should return empty array if recipe not found', async () => {
      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(null);
      const route = {
        paramMap: { get: () => 'unknown' },
        queryParamMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, {} as RouterStateSnapshot),
      );
      expect(result).toEqual([]);
    });
  });

  describe('schemaResolver extra coverage', () => {
    it('should return only Home breadcrumb if path is empty', () => {
      const route = {
        data: { description: 'desc' },
        paramMap: { get: () => '' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => schemaResolver(route, state)) as Record<
        string,
        unknown
      >[];
      const breadcrumbList = result.find((s) => s['@type'] === 'BreadcrumbList') as Record<
        string,
        unknown
      >;
      const items = breadcrumbList['itemListElement'] as { name: string }[];
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Home');
    });

    it('should return empty array in getRecipeBreadcrumbs if breadcrumbs is missing or invalid', () => {
      const recipe1 = createMockRecipe({ breadcrumbs: undefined });
      expect(getRecipeBreadcrumbs(recipe1)).toEqual([]);

      const recipe2 = createMockRecipe({
        breadcrumbs: { main: undefined as unknown as number, items: [] },
      });
      expect(getRecipeBreadcrumbs(recipe2)).toEqual([]);
    });

    it('should handle recipe rating and reviewCount fallbacks in generateRecipeSchema', async () => {
      const mockRecipe = createMockRecipe({
        title: 'No Rating Recipe',
        slug: 'no-rating',
        rating: undefined,
        ratingCount: undefined,
        reviewCount: undefined,
      });

      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'no-rating' },
        queryParamMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/no-rating' } as RouterStateSnapshot;

      const result = (await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, state),
      )) as Record<string, unknown>[];

      const recipeSchema = result.find((s) => s['@type'] === ('Recipe' as unknown)) as Record<
        string,
        unknown
      >;
      const aggregateRating = recipeSchema['aggregateRating'] as Record<string, number>;
      expect(aggregateRating['ratingValue']).toBe(5);
      expect(aggregateRating['reviewCount']).toBe(1);
    });

    it('should reuse existing script tag if present in schemaRecipeResolver', async () => {
      const mockRecipe = createMockRecipe({
        title: 'Recipe',
        slug: 'recipe',
        author: 'Author',
      });
      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(mockRecipe);

      const existingScript = { setAttribute: vi.fn(), textContent: '' };
      mockDocument.querySelector = vi.fn().mockReturnValue(existingScript);

      const route = {
        paramMap: { get: () => 'recipe' },
        queryParamMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/recipe' } as RouterStateSnapshot;

      await TestBed.runInInjectionContext(() => schemaRecipeResolver(route, state));

      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(existingScript.textContent).toContain('@context');
    });

    it('should fall back to Recipe course in generateRecipeSchema when course is missing', async () => {
      const mockRecipe = createMockRecipe({
        title: 'No Course Recipe',
        slug: 'no-course',
        course: undefined,
      });

      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'no-course' },
        queryParamMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/no-course' } as RouterStateSnapshot;

      const result = (await TestBed.runInInjectionContext(() =>
        schemaRecipeResolver(route, state),
      )) as Record<string, unknown>[];
      const articleSchema = result.find((s) => s['@type'] === ('Article' as unknown)) as Record<
        string,
        unknown
      >;
      expect(articleSchema['articleSection'] as string[]).toEqual(['Recipe']);
    });
  });
});
