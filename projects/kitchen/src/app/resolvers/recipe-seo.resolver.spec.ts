import { APP_BASE_HREF, DOCUMENT, IMAGE_LOADER, PathLocationStrategy } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeoContent } from '../models/seo-content';
import { RecipeService } from '../services/recipe.service';
import { SeoService } from '../services/seo.service';
import { seoRecipeResolver } from './recipe-seo.resolver';

describe('seoRecipeResolver', () => {
  let seoService: SeoService;
  let recipeService: RecipeService;
  let imageLoaderFn: ({ src }: { src: string }) => string;
  let mockDocument: { location: { origin: string; href: string } };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    mockDocument = {
      location: { origin: 'http://localhost:4200', href: 'http://localhost:4200/recipe/test' },
    };
    imageLoaderFn = ({ src }: { src: string }) => src;

    TestBed.configureTestingModule({
      providers: [
        { provide: SeoService, useValue: { setSEO: vi.fn() } },
        {
          provide: RecipeService,
          useValue: {
            getSeoBySlug: vi.fn().mockResolvedValue(null),
            getTitle: vi.fn().mockResolvedValue(null),
          },
        },
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: IMAGE_LOADER, useValue: (config: { src: string }) => imageLoaderFn(config) },
      ],
    });

    seoService = TestBed.inject(SeoService);
    recipeService = TestBed.inject(RecipeService);
  });

  it('should resolve recipe SEO data with relative image path', async () => {
    const mockSeo = {
      title: 'Title',
      description: 'Desc',
      image: '/img.jpg',
      keywords: ['key'],
      imageWidth: '800',
      imageHeight: '800',
      imageType: 'image/jpeg',
    };

    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue(mockSeo);

    const route = {
      paramMap: { get: () => 'test-slug' },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/test-slug?preview=123#section' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(recipeService.getSeoBySlug).toHaveBeenCalledWith('test-slug');
    expect(result.title).toBe("Title | Delisha Marie's Kitchen");
    expect(result.content).toBe('index,follow');
    expect(result.url).toBe('http://localhost:4200/recipe/test-slug');
    expect(result.image).toBe('http://localhost:4200/img.jpg');
    expect(seoService.setSEO).toHaveBeenCalledWith(result);
  });

  it('should handle relative image without leading slash and default imageWidth', async () => {
    const mockSeo = {
      title: 'Title',
      description: 'Desc',
      image: 'assets/img.jpg',
      keywords: ['key'],
    };

    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue(mockSeo);

    const route = {
      paramMap: { get: () => 'test-slug' },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/test-slug' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(result.image).toBe('http://localhost:4200/assets/img.jpg');
  });

  it('should preserve absolute http image URL from loader', async () => {
    imageLoaderFn = ({ src }: { src: string }) => `https://cdn.example.com/${src}`;

    const mockSeo = {
      title: 'Title',
      description: 'Desc',
      image: 'img.jpg',
      keywords: ['key'],
    };

    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue(mockSeo);

    const route = {
      paramMap: { get: () => 'test-slug' },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/test-slug' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(result.image).toBe('https://cdn.example.com/img.jpg');
  });

  it('should return 404 Recipe Not Found SEO with noindex,nofollow when slug is missing', async () => {
    const route = {
      paramMap: { get: () => null },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(result.title).toBe("Recipe Not Found | Delisha Marie's Kitchen");
    expect(result.content).toBe('noindex,nofollow');
    expect(seoService.setSEO).toHaveBeenCalledWith(result);
  });

  it('should return 404 Recipe Not Found SEO with noindex,nofollow when backend returns null and no preview token is present', async () => {
    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue(null);

    const route = {
      paramMap: { get: () => 'missing-recipe' },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/missing-recipe' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(recipeService.getSeoBySlug).toHaveBeenCalledWith('missing-recipe');
    expect(result.title).toBe("Recipe Not Found | Delisha Marie's Kitchen");
    expect(result.content).toBe('noindex,nofollow');
    expect(seoService.setSEO).toHaveBeenCalledWith(result);
  });

  it('should set title from seo object in meta tags while keeping noindex,nofollow and empty SEO fields for scheduled preview', async () => {
    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue({
      title: 'Scheduled Beef Stew',
      description: 'Scheduled description',
      keywords: ['stew'],
      image: '/stew.jpg',
    });

    const route = {
      paramMap: { get: () => 'scheduled-recipe' },
      queryParamMap: { get: (key: string) => (key === 'preview' ? 'token-123' : null) },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/scheduled-recipe?preview=token-123' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(recipeService.getSeoBySlug).toHaveBeenCalledWith('scheduled-recipe', false, 'token-123');
    expect(result.title).toBe("Scheduled Beef Stew | Delisha Marie's Kitchen");
    expect(result.description).toBe('');
    expect(result.keywords).toEqual([]);
    expect(result.image).toBe('');
    expect(result.content).toBe('noindex,nofollow');
    expect(seoService.setSEO).toHaveBeenCalledWith(result);
  });

  it('should fall back to 404 Recipe Not Found SEO when preview token is invalid and getSeoBySlug returns null', async () => {
    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue(null);

    const route = {
      paramMap: { get: () => 'scheduled-recipe' },
      queryParamMap: { get: (key: string) => (key === 'preview' ? 'bad-token' : null) },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/scheduled-recipe?preview=bad-token' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(recipeService.getSeoBySlug).toHaveBeenCalledWith('scheduled-recipe', false, 'bad-token');
    expect(result.title).toBe("Recipe Not Found | Delisha Marie's Kitchen");
    expect(result.content).toBe('noindex,nofollow');
    expect(seoService.setSEO).toHaveBeenCalledWith(result);
  });

  it('should handle missing description and image', async () => {
    const mockSeo = {
      title: 'Title',
      description: undefined as unknown as string,
      image: undefined as unknown as string,
      keywords: [],
    };

    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue(mockSeo);

    const route = {
      paramMap: { get: () => 'no-desc-no-img' },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/no-desc-no-img' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(result.description).toBe('');
    expect(result.image).toBe('');
  });

  it('should use non-root baseHref from PathLocationStrategy', async () => {
    const spy = vi
      .spyOn(PathLocationStrategy.prototype, 'getBaseHref')
      .mockReturnValue('/kitchen/');
    vi.mocked(recipeService.getSeoBySlug).mockResolvedValue({
      title: 'Title',
      description: 'Desc',
      image: '/img.jpg',
    });

    const route = {
      paramMap: { get: () => 'my-recipe' },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/recipe/my-recipe' } as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() => {
      return seoRecipeResolver(route, state);
    })) as SeoContent;

    expect(result.url).toBe('http://localhost:4200/kitchen/recipe/my-recipe');
    spy.mockRestore();
  });
});
