import { Injectable, computed, inject, resource } from '@angular/core';
import type { BaseRecipe, Breadcrumbs, Comment, Nutrition } from '@dm/library';
import { Api } from './api';
export type { Comment };

export interface Recipe extends BaseRecipe {
  breadcrumbs: Breadcrumbs;
  nutrition: Nutrition;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
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
   * Modern signal-native resource for fetching all recipes.
   * Completely eliminates 'from', 'Observable', and 'toSignal'.
   */
  private readonly _recipesResource = resource({
    loader: () => this.api.get<{ items: Recipe[]; total: number }>('/api/recipes'),
  });

  readonly recipes = computed(() => this._recipesResource.value()?.items || []);

  /**
   * Fetches a single recipe by its slug.
   */
  getRecipeBySlug(slug: string): Promise<Recipe | null> {
    const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const normalizedSearch = clean(slug);

    let cached = this.recipeCache.get(normalizedSearch);
    if (!cached) {
      cached = this.api.get<Recipe | null>(`/api/recipes/${normalizedSearch}`).catch(() => null);
      this.recipeCache.set(normalizedSearch, cached);

      setTimeout(() => {
        this.recipeCache.delete(normalizedSearch);
      }, 5000);
    }
    return cached;
  }

  /**
   * Fetches a paginated slice of recipes.
   * Now returns a Promise directly by leveraging the Api server's firstValueFrom pattern.
   */
  getRecipes(
    page: number,
    pageSize: number,
    method: string,
    category?: string,
    subcategory?: string,
  ): Promise<{ items: Recipe[]; total: number }> {
    const url = `/api/recipes?page=${page}&pageSize=${pageSize}&method=${method}&category=${category || ''}&subcategory=${subcategory || ''}`;
    return this.api.get<{ items: Recipe[]; total: number }>(url);
  }

  /**
   * Fetches all comments for a specific recipe.
   */
  getComments(recipeId: string | number): Promise<Comment[]> {
    return this.api.get<Comment[]>('/api/comments').then((all) => {
      const id = String(recipeId);
      return all.filter((c) => String(c.recipeId) === id);
    });
  }

  /**
   * Adds a new comment to a recipe.
   * Mock implementation for development.
   */
  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newComment: Comment = {
      ...comment,
      id: `c${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    return newComment;
  }
}
