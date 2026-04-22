import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import {
  schemaResolver,
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
import { Recipe } from '../services/recipe.service';

describe('schemaResolver', () => {
  let mockDocument: {
    location: { origin: string };
    createElement: Mock;
    head: { appendChild: Mock };
    querySelector: Mock;
  };

  beforeEach(() => {
    mockDocument = {
      location: { origin: 'http://localhost:4200' },
      createElement: vi.fn().mockReturnValue({ setAttribute: vi.fn() }),
      head: { appendChild: vi.fn() },
      querySelector: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: mockDocument }],
    });
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

    it('getRecipeBreadcrumbs', () => {
      const recipe: Recipe = {
        id: 1,
        title: 'Title',
        description: '',
        image: '',
        category: '',
        prepTime: '',
        cookTime: '',
        difficulty: '',
        featured: false,
        slug: 'title',
        method: 'Air Fryer',
      };
      const result = getRecipeBreadcrumbs(recipe);
      // It should generate Method trail because method is present
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].label).toBe('Method');
    });

    it('getBaseBreadcrumbs', () => {
      const result = getBaseBreadcrumbs('/recipes/desserts');
      expect(result.length).toBe(3);
      expect(result[0].label).toBe('Home');
      expect(result[1].label).toBe('Recipes');
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
    });
  });
});
