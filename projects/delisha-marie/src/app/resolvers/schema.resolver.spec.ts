import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import {
  schemaResolver,
  schemaRecipeResolver,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateCollectionPageSchema,
  generateAboutPageSchema,
  generateContactPageSchema,
  generateFAQPageSchema,
  generateWebPageSchema,
  generateBreadcrumbSchema,
  getRecipeBreadcrumbs,
  getBaseBreadcrumbs,
} from './schema.resolver';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Recipe, RecipeService } from '../services/recipe.service';

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

    it('getRecipeBreadcrumbs - should generate trails for all attributes', () => {
      const recipe: Recipe = {
        id: 1,
        title: 'Title',
        description: '',
        image: '',
        category: 'Desserts',
        prepTime: '',
        cookTime: '',
        difficulty: '',
        theBest: false,
        slug: 'title',
        method: 'Air Fryer',
        specialDiets: ['Vegan'],
        holidays: ['Christmas'],
        author: 'Delisha Marie',
        totalTime: '',
      };
      const result = getRecipeBreadcrumbs(recipe);

      const labels = result.map((b) => b.label);
      expect(labels).toContain('Method');
      expect(labels).toContain('Air Fryer');
      expect(labels).toContain('Special Diets');
      expect(labels).toContain('Vegan');
      expect(labels).toContain('Holidays');
      expect(labels).toContain('Christmas');
    });

    it('getBaseBreadcrumbs - basic path', () => {
      const result = getBaseBreadcrumbs('/recipes/desserts');
      expect(result.length).toBe(3);
      expect(result[0].label).toBe('Home');
      expect(result[1].label).toBe('Recipes');
      expect(result[2].label).toBe('Desserts');
    });

    it('getBaseBreadcrumbs - empty or undefined', () => {
      let result = getBaseBreadcrumbs('');
      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Home');

      result = getBaseBreadcrumbs();
      expect(result.length).toBe(1);
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
  });

  describe('schemaRecipeResolver', () => {
    it('should return recipe schema array', async () => {
      const mockRecipe: Recipe = {
        id: 1,
        title: 'Recipe',
        slug: 'recipe',
        description: 'Desc',
        image: '/img.jpg',
        category: 'Cat',
        prepTime: '10m',
        cookTime: '10m',
        totalTime: '20m',
        difficulty: 'Easy',
        author: 'Author',
        ingredients: ['Ing1'],
        instructions: ['Step1'],
      };

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
      expect(result.some((s) => s['@type'] === 'Recipe')).toBe(true);
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
});
