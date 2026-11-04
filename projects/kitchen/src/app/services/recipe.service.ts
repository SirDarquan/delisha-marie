import { Injectable, inject, TransferState, makeStateKey } from '@angular/core';
import type { BaseRecipe, Breadcrumbs, Comment, Nutrition } from '@dm/library';
import { Api } from './api';
export type { Comment };

export interface PaginatedComments {
  comments: Comment[];
  total: number;
  stats?: {
    reviewCount: number;
    ratingCount: number;
    rating: number;
  };
}

export interface Equipment {
  id: string;
  recipeId: string;
  title: string;
  image: string;
  url: string;
}

export interface RecipeSeoData {
  title: string;
  description: string;
  keywords?: string[];
  image: string;
  imageWidth?: string;
  imageHeight?: string;
  imageType?: string;
}

export interface Recipe extends BaseRecipe {
  breadcrumbs: Breadcrumbs;
  nutrition: Nutrition;
  comments: Comment[];
  rating: number;
  ratingCount: number;
  reviewCount: number;
  cuisine: string;
  course: string;
  method: string;
  navigation: NavigationLinks;
}

export interface NavigationLink {
  title: string;
  slug: string;
}

export interface NavigationLinks {
  prev: NavigationLink | null;
  next: NavigationLink | null;
}

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly api = inject(Api);
  private readonly transferState = inject(TransferState);
  private readonly recipeCache = new Map<string, Promise<Recipe | null>>();
  private readonly seoCache = new Map<string, Promise<RecipeSeoData | null>>();
  private readonly schemaCache = new Map<string, Promise<Recipe | null>>();

  private normalizeSchemaRecipe(schemaRecipe: Recipe): Recipe {
    const defaultBreadcrumbs = {
      main: 0,
      items: [
        [
          { label: 'Home', url: '/' },
          {
            label: schemaRecipe.theBest ? 'The Best Recipes' : 'Recipes',
            url: schemaRecipe.theBest ? '/the-best-recipes' : '/recipes',
          },
          { label: schemaRecipe.title, url: `/recipe/${schemaRecipe.slug}` },
        ],
      ],
    };
    return {
      ...schemaRecipe,
      breadcrumbs: schemaRecipe.breadcrumbs || defaultBreadcrumbs,
      navigation: schemaRecipe.navigation || { prev: null, next: null },
    };
  }

  /**
   * Fetches a single recipe by its slug.
   */
  getRecipeBySlug(slug: string, refresh = false, previewToken?: string): Promise<Recipe | null> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const normalizedSearch = clean(slug);

    if (refresh) {
      this.recipeCache.delete(normalizedSearch);
      this.schemaCache.delete(normalizedSearch);
    }

    if (previewToken) {
      return this.api
        .get<Recipe | null>(
          `/recipes/${normalizedSearch}?preview=${encodeURIComponent(previewToken)}`,
        )
        .catch(() => null);
    }

    let cached = this.recipeCache.get(normalizedSearch);
    if (!cached) {
      const fetchRecipe = async (): Promise<Recipe | null> => {
        const schemaPromise = this.schemaCache.get(normalizedSearch);
        if (schemaPromise) {
          const schemaRecipe = await schemaPromise;
          if (schemaRecipe) {
            return this.normalizeSchemaRecipe(schemaRecipe);
          }
        }

        const schemaKey = makeStateKey<Recipe | null>(
          `API_GET_/api/recipes/${normalizedSearch}/schema`,
        );
        if (this.transferState.hasKey(schemaKey)) {
          const schemaRecipe = this.transferState.get(schemaKey, null);
          if (schemaRecipe) {
            return this.normalizeSchemaRecipe(schemaRecipe);
          }
        }

        return await this.api.get<Recipe | null>(`/recipes/${normalizedSearch}`).catch(() => null);
      };

      cached = fetchRecipe();
      this.recipeCache.set(normalizedSearch, cached);

      setTimeout(
        () => {
          this.recipeCache.delete(normalizedSearch);
        },
        5 * 60 * 1000,
      ); // Cache for 5 minutes instead of 5 seconds
    }
    return cached;
  }

  /**
   * Fetches a single recipe SEO by its slug.
   */
  getSeoBySlug(
    slug: string,
    refresh = false,
    previewToken?: string,
  ): Promise<RecipeSeoData | null> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const normalizedSearch = clean(slug);

    if (refresh) {
      this.seoCache.delete(normalizedSearch);
    }

    if (previewToken) {
      return this.api
        .get<RecipeSeoData | null>(
          `/recipes/${normalizedSearch}/seo?preview=${encodeURIComponent(previewToken)}`,
        )
        .catch(() => null);
    }

    let cached = this.seoCache.get(normalizedSearch);
    if (!cached) {
      cached = this.api
        .get<RecipeSeoData | null>(`/recipes/${normalizedSearch}/seo`)
        .catch(() => null);
      this.seoCache.set(normalizedSearch, cached);

      setTimeout(
        () => {
          this.seoCache.delete(normalizedSearch);
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }
    return cached;
  }

  /**
   * Fetches a single recipe JSON-LD Schema by its slug.
   */
  getSchemaBySlug(slug: string, refresh = false): Promise<Recipe | null> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const normalizedSearch = clean(slug);

    if (refresh) {
      this.schemaCache.delete(normalizedSearch);
      this.recipeCache.delete(normalizedSearch);
    }

    let cached = this.schemaCache.get(normalizedSearch);
    if (!cached) {
      const recipePromise = this.recipeCache.get(normalizedSearch);
      if (recipePromise) {
        cached = recipePromise;
        this.schemaCache.set(normalizedSearch, cached);
      } else {
        cached = this.api
          .get<Recipe | null>(`/recipes/${normalizedSearch}/schema`)
          .catch(() => null);
        this.schemaCache.set(normalizedSearch, cached);
      }

      setTimeout(
        () => {
          this.schemaCache.delete(normalizedSearch);
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }
    return cached;
  }

  async getTitle(slug: string, previewToken?: string): Promise<string | null> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const normalized = clean(slug);

    const recipePromise = this.recipeCache.get(normalized);
    if (recipePromise) {
      const r = await recipePromise;
      if (r?.title) return r.title;
    }

    const schemaPromise = this.schemaCache.get(normalized);
    if (schemaPromise) {
      const s = await schemaPromise;
      if (s?.title) return s.title;
    }

    const seoPromise = this.seoCache.get(normalized);
    if (seoPromise) {
      const seo = await seoPromise;
      if (seo?.title) return seo.title;
    }

    const query = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : '';
    return this.api
      .get<{ title: string | null } | null>(`/recipes/${normalized}/title${query}`)
      .then((res) => res?.title ?? null)
      .catch(() => null);
  }
  private readonly getRecipesCache = new Map<
    string,
    { timestamp: number; promise: Promise<{ items: Recipe[]; total: number }> }
  >();

  /**
   * Fetches a paginated slice of recipes.
   * Now returns a Promise directly by leveraging the Api server's firstValueFrom pattern.
   * Caches the result in-memory for 5 minutes to make client-side SPA navigation instant.
   */
  getRecipes(
    page: number,
    pageSize: number,
    method: string,
    category?: string,
    subcategory?: string,
    rating?: boolean,
  ): Promise<{ items: Recipe[]; total: number }> {
    const url = `/recipes?page=${page}&pageSize=${pageSize}&method=${method}&category=${category || ''}&subcategory=${subcategory || ''}&rating=${rating || ''}`;
    const minutes = 5 * 60 * 1000;
    const cached = this.getRecipesCache.get(url);
    if (cached && Date.now() - cached.timestamp < minutes) {
      // 5 minutes
      return cached.promise;
    }

    const promise = this.api.get<{ items: Recipe[]; total: number }>(url).catch((err) => {
      this.getRecipesCache.delete(url);
      throw err;
    });
    this.getRecipesCache.set(url, { timestamp: Date.now(), promise });
    return promise;
  }

  /**
   * Pre-fetches recipe detail by slug into the in-memory cache silently.
   */
  prefetchRecipeBySlug(slug: string): void {
    if (!slug) return;
    void this.getRecipeBySlug(slug).catch(() => {
      // Quiet background failure
    });
  }
  /**
   * Pre-fetches a page into the in-memory cache silently in the background.
   */
  prefetchRecipes(
    page: number,
    pageSize: number,
    method: string,
    category?: string,
    subcategory?: string,
    rating?: boolean,
  ): void {
    void this.getRecipes(page, pageSize, method, category, subcategory, rating).catch(() => {
      // Quiet background failure
    });
  }

  private readonly favoritesCache = {
    timestamp: 0,
    promise: null as Promise<{ items: Recipe[] }> | null,
  };

  /**
   * Fetches all favorite recipes. Caches in-memory for 5 minutes.
   */
  getFavoriteRecipes(): Promise<{ items: Recipe[] }> {
    const minutes = 5 * 60 * 1000;
    const now = Date.now();
    if (this.favoritesCache.promise && now - this.favoritesCache.timestamp < minutes) {
      return this.favoritesCache.promise;
    }

    const promise = this.api.get<{ items: Recipe[] }>('/recipes/favorites/list').catch((err) => {
      this.favoritesCache.promise = null;
      throw err;
    });

    this.favoritesCache.timestamp = now;
    this.favoritesCache.promise = promise;
    return promise;
  }

  /**
   * Fetches all comments for a specific recipe.
   */
  getComments(
    recipeId: string | number,
    page?: number,
    limit?: number,
  ): Promise<PaginatedComments> {
    const maxLimit = limit ? `&limit=${limit}` : '';
    const url = `/recipes/${recipeId}/comments?page=${page || ''}${maxLimit}`;
    return this.api.get<PaginatedComments>(url);
  }

  /**
   * Fetches 6 top comments for a specific recipe.
   */
  getTopComments(slug: string): Promise<Comment[]> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const url = `/recipes/${clean(slug)}/comments/top`;
    return this.api.get<Comment[]>(url);
  }

  /**
   * Fetches adjacent sibling navigation (prev/next) for a recipe by slug.
   */
  getRecipeNavigation(slug: string): Promise<NavigationLinks> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    return this.api.get<NavigationLinks>(`/recipes/${clean(slug)}/navigation`);
  }

  /**
   * Fetches recipe ratings and review statistics.
   */
  getRecipeStats(
    slugOrId: string,
  ): Promise<{ reviewCount: number; ratingCount: number; rating: number }> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    return this.api.get<{ reviewCount: number; ratingCount: number; rating: number }>(
      `/recipes/${clean(slugOrId)}/stats`,
    );
  }

  /**
   * Adds a new comment to a recipe.
   */
  addComment(
    comment: Omit<Comment, 'id' | 'createdAt'> & { alt_email?: string },
  ): Promise<Comment> {
    return this.api.post<Comment>(`/recipes/${comment.recipeId}/comments`, comment);
  }

  /**
   * Fetches equipment list for a specific recipe.
   */
  getRecipeEquipment(recipeId: string | number): Promise<Equipment[]> {
    return this.api.get<Equipment[]>(`/recipes/${recipeId}/equipment`);
  }
}
