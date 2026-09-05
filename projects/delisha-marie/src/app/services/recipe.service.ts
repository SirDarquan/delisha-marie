import { Injectable, inject } from '@angular/core';
import type { BaseRecipe, Breadcrumbs, Comment, Nutrition } from '@dm/library';
import { Api } from './api';
export type { Comment };

export interface Equipment {
  id: string;
  recipeId: string;
  title: string;
  image: string;
  url: string;
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
  private readonly recipeCache = new Map<string, Promise<Recipe | null>>();

  /**
   * Fetches a single recipe by its slug.
   */
  getRecipeBySlug(slug: string): Promise<Recipe | null> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const normalizedSearch = clean(slug);

    let cached = this.recipeCache.get(normalizedSearch);
    if (!cached) {
      cached = this.api.get<Recipe | null>(`/recipes/${normalizedSearch}`).catch(() => null);
      this.recipeCache.set(normalizedSearch, cached);

      setTimeout(() => {
        this.recipeCache.delete(normalizedSearch);
      }, 5000);
    }
    return cached;
  }

  async getTitle(slug: string): Promise<string | null> {
    return this.api
      .get<{ title: string | null }>(`/recipes/${slug}/title`)
      .then((res) => res.title)
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

    const cached = this.getRecipesCache.get(url);
    if (cached && Date.now() - cached.timestamp < 300000) {
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
   * Fetches all favorite recipes.
   */
  getFavoriteRecipes(): Promise<{ items: Recipe[] }> {
    return this.api.get<{ items: Recipe[] }>('/recipes/favorites/list');
  }

  /**
   * Fetches all comments for a specific recipe.
   */
  getComments(
    recipeId: string | number,
    page?: number,
  ): Promise<{ comments: Comment[]; total: number }> {
    const url = `/recipes/${recipeId}/comments?page=${page || ''}`;
    return this.api.get<{ comments: Comment[]; total: number }>(url);
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
