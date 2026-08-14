import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeoContent } from '../models/seo-content';
import { RecipeListService } from '../pages/recipe-list/recipe-list.service';
import { PagesService, Page } from '../services/pages.service';
import { Recipe, RecipeService } from '../services/recipe.service';
import { SeoService } from '../services/seo.service';
import {
  seoDynamicPageResolver,
  seoRecipeListResolver,
  seoRecipeResolver,
  seoResolver,
} from './seo.resolver';

describe('Seo Resolvers', () => {
  let seoService: SeoService;
  let recipeListService: RecipeListService;
  let recipeService: RecipeService;
  let dynamicPageService: PagesService;
  let mockDocument: { location: { origin: string; href: string } };

  beforeEach(() => {
    mockDocument = {
      location: { origin: 'http://localhost:4200', href: 'http://localhost:4200/test' },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SeoService, useValue: { setSEO: vi.fn() } },
        {
          provide: RecipeListService,
          useValue: {
            getInfo: vi.fn().mockReturnValue({
              title: 'Dynamic Title',
              description: 'Dynamic Desc',
              image: '/img.jpg',
            }),
          },
        },
        {
          provide: RecipeService,
          useValue: { getRecipeBySlug: vi.fn().mockResolvedValue(null) },
        },
        {
          provide: PagesService,
          useValue: { getPage: vi.fn().mockResolvedValue(null) },
        },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    seoService = TestBed.inject(SeoService);
    recipeListService = TestBed.inject(RecipeListService);
    recipeService = TestBed.inject(RecipeService);
    dynamicPageService = TestBed.inject(PagesService);
  });

  describe('seoResolver', () => {
    it('should call seoService.setSEO with resolved data and placeholders', () => {
      const route = {
        data: {
          description: 'Test Description',
        },
        title: 'Test',
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/test' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test | Delisha Marie's Kitchen",
          description: 'Test Description',
          url: 'http://localhost:4200/test',
        }),
      );
    });

    it('should handle root path correctly', () => {
      const route = {
        data: {},
        title: 'Home',
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'http://localhost:4200' }),
      );
    });

    it('should handle missing image correctly', () => {
      const route = {
        data: { image: undefined },
        title: 'No Image',
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/no-image' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(expect.objectContaining({ image: '' }));
    });

    it('should handle truthy image correctly', () => {
      const route = {
        data: { image: '/assets/img.jpg' },
        title: 'With Image',
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/with-image' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({ image: 'http://localhost:4200/assets/img.jpg' }),
      );
    });

    it('should resolve origin in arrays', () => {
      const route = {
        data: {
          keywords: ['key1', '{{origin}}/key2'],
        },
        title: 'Array Test',
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/array' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          keywords: ['key1', 'http://localhost:4200/key2'],
        }),
      );
    });

    it('should handle primitives and null in resolveDynamicOrigin', () => {
      const route = {
        data: {
          imageWidth: null,
          imageHeight: 42,
        },
        title: 'Primitives Test',
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/primitives' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          imageWidth: null,
          imageHeight: 42,
        }),
      );
    });

    it('should use slug for title if available and handle custom type, twitterCard, and content', () => {
      const route = {
        data: {
          type: 'article',
          twitterCard: 'summary',
          content: 'noindex',
        },
        title: 'Fallback Title',
        paramMap: { get: (key: string) => (key === 'slug' ? 'Slug Title' : null) },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/test-slug?q=1#hash' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Slug Title | Delisha Marie's Kitchen",
          type: 'article',
          twitterCard: 'summary',
          content: 'noindex',
          url: 'http://localhost:4200/test-slug',
        }),
      );
    });
  });

  describe('seoRecipeListResolver', () => {
    it('should call recipeListService.getInfo and update SEO', () => {
      const route = {
        paramMap: {
          get: vi.fn().mockImplementation((key) => {
            if (key === 'category') return 'test-cat';
            return null;
          }),
        },
        routeConfig: { path: 'recipes/:category' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipes/test-cat' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoRecipeListResolver(route, state);
      });

      expect(recipeListService.getInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test-cat',
          url: 'recipes',
        }),
      );
      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Dynamic Title',
          siteName: "Delisha Marie's Kitchen",
          url: 'http://localhost:4200/recipes/test-cat',
        }),
      );
    });

    it('should handle missing parameters and routeConfig', () => {
      const route = {
        paramMap: { get: vi.fn().mockReturnValue(null) },
        routeConfig: {}, // No path
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipes' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoRecipeListResolver(route, state);
      });

      expect(recipeListService.getInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          category: undefined,
          url: '',
        }),
      );
    });

    it('should handle subcategory and full path with query/hash', () => {
      const route = {
        paramMap: {
          get: vi.fn().mockImplementation((key) => {
            if (key === 'category') return 'test-cat';
            if (key === 'subcategory') return 'test-sub';
            return null;
          }),
        },
        routeConfig: { path: 'recipes/test-cat/test-sub' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipes/test-cat/test-sub?query=1#hash' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => {
        seoRecipeListResolver(route, state);
      });

      expect(recipeListService.getInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test-cat',
          subCategory: 'test-sub',
          url: 'recipes',
        }),
      );
      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:4200/recipes/test-cat/test-sub',
        }),
      );
    });
  });

  describe('seoRecipeResolver', () => {
    beforeEach(() => {
      vi.mocked(recipeService.getRecipeBySlug).mockClear();
    });

    it('should resolve recipe SEO data', async () => {
      const mockRecipe = {
        title: 'Title',
        description: 'Desc',
        image: '/img.jpg',
        keywords: ['key'],
        imageWidth: '800',
        imageHeight: '800',
      } as Recipe;

      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'test-slug' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/test-slug' } as RouterStateSnapshot;

      await TestBed.runInInjectionContext(() => {
        return seoRecipeResolver(route, state);
      });

      expect(recipeService.getRecipeBySlug).toHaveBeenCalledWith('test-slug');
      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Title | Delisha Marie's Kitchen",
          description: 'Desc',
          image: 'http://localhost:4200/img.jpg',
        }),
      );
    });

    it('should return 404 SEO if slug missing', async () => {
      const route = {
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return seoRecipeResolver(route, { url: '/recipe/unknown' } as RouterStateSnapshot);
      });

      expect((result as SeoContent).content).toBe('noindex,nofollow');
    });

    it('should return 404 SEO if recipe not found', async () => {
      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(null);

      const route = {
        paramMap: { get: () => 'unknown' },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return seoRecipeResolver(route, { url: '/recipe/unknown' } as RouterStateSnapshot);
      });

      expect((result as SeoContent).content).toBe('noindex,nofollow');
    });

    it('should handle missing description and image in seoRecipeResolver', async () => {
      const mockRecipe = {
        title: 'Title',
        description: undefined as unknown as string,
        image: undefined as unknown as string,
        keywords: [],
      } as unknown as Recipe;

      vi.mocked(recipeService.getRecipeBySlug).mockResolvedValue(mockRecipe);

      const route = {
        paramMap: { get: () => 'no-desc-no-img' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/recipe/no-desc-no-img' } as RouterStateSnapshot;

      await TestBed.runInInjectionContext(() => {
        return seoRecipeResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
          image: '',
        }),
      );
    });
  });

  describe('seoDynamicPageResolver', () => {
    beforeEach(() => {
      vi.mocked(dynamicPageService.getPage).mockClear();
    });

    it('should resolve dynamic page SEO data', async () => {
      const mockPage: Page = {
        id: '1',
        slug: 'test-slug',
        title: 'Page Title',
        content: 'Content',
        description: 'Page Desc',
        updated_at: '2024-01-01',
        keywords: ['page-key'],
      };

      vi.mocked(dynamicPageService.getPage).mockResolvedValue(mockPage);

      const route = {
        paramMap: { get: () => 'test-slug' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/page/test-slug' } as RouterStateSnapshot;

      await TestBed.runInInjectionContext(() => {
        return seoDynamicPageResolver(route, state);
      });

      expect(dynamicPageService.getPage).toHaveBeenCalledWith('test-slug');
      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Page Title | Delisha Marie's Kitchen",
          description: 'Page Desc',
        }),
      );
    });

    it('should return 404 SEO if slug missing', async () => {
      const route = {
        paramMap: { get: () => null },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return seoDynamicPageResolver(route, { url: '/page/unknown' } as RouterStateSnapshot);
      });

      expect((result as SeoContent).content).toBe('noindex,nofollow');
    });

    it('should return 404 SEO if page not found', async () => {
      vi.mocked(dynamicPageService.getPage).mockResolvedValue(null);

      const route = {
        paramMap: { get: () => 'unknown' },
      } as unknown as ActivatedRouteSnapshot;

      const result = await TestBed.runInInjectionContext(() => {
        return seoDynamicPageResolver(route, { url: '/page/unknown' } as RouterStateSnapshot);
      });

      expect((result as SeoContent).content).toBe('noindex,nofollow');
    });

    it('should handle missing description in seoDynamicPageResolver', async () => {
      const mockPage: Page = {
        id: '1',
        slug: 'no-desc',
        title: 'Title',
        content: 'Content',
        description: undefined,
        updated_at: '2024-01-01',
        keywords: [],
      };

      vi.mocked(dynamicPageService.getPage).mockResolvedValue(mockPage);

      const route = {
        paramMap: { get: () => 'no-desc' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/page/no-desc' } as RouterStateSnapshot;

      await TestBed.runInInjectionContext(() => {
        return seoDynamicPageResolver(route, state);
      });

      expect(seoService.setSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
        }),
      );
    });
  });
});
