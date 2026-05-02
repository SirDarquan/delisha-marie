import { Injectable, inject, resource, computed } from '@angular/core';
import { Api } from './api';

export interface Breadcrumb {
  label: string;
  url?: string;
}

export interface Breadcrumbs {
  main?: number;
  items: Breadcrumb[][];
}

export interface Nutrition {
  calories: string;
  carbohydrates: string;
  protein: string;
  fat: string;
  saturatedFat: string;
  cholesterol: string;
  sodium: string;
  fiber: string;
  sugar: string;
  servingSize: string;
}

export interface Comment {
  id: string;
  parentId?: string;
  recipeId: string;
  author: string;
  email: string;
  content: string;
  rating?: number;
  website?: string;
  createdAt: string;
}

export interface Recipe {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  content: string;
  ingredients: string[];
  instructions: string[];
  image: string;
  imageWidth?: string;
  imageHeight?: string;
  imageType?: string;
  theBest?: boolean;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  totalTime: string;
  yield: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  comments: Comment[];
  notes?: string[];
  equipment?: string[];
  nutrition: Nutrition;
  cuisine: string;
  course: string;
  method: string;
  category?: string;
  subcategory?: string;
  linkedIngredients?: { name: string; slug: string; text: string; measure?: string }[];
  breadcrumbs: Breadcrumbs;
  keywords?: string[];
  specialDiets?: string[];
  holidays?: string[];
  status?: 'draft' | 'scheduled' | 'published';
  likes?: number;
  preview_token?: string;
  navigation: {
    prev: NavigationLink | null;
    next: NavigationLink | null;
  };
}

export interface NavigationLink {
  title: string;
  slug: string;
}

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly api = inject(Api);

  /**
   * Modern signal-native resource for fetching all recipes.
   * Completely eliminates 'from', 'Observable', and 'toSignal'.
   */
  private readonly _recipesResource = resource({
    loader: () => this.api.get<Recipe[]>('/api/recipes'),
  });

  readonly recipes = computed(() => this._recipesResource.value() || []);

  /**
   * Fetches a single recipe by its slug.
   */
  async getRecipeBySlug(slug: string): Promise<Recipe | null> {
    try {
      const all = await this.api.get<Recipe[]>('/api/recipes');
      const clean = (s: string) => s.replace(/^\/?recipe\//, '').replace(/^\//, '');
      const normalizedSearch = clean(slug);

      const found = all.find((r) => clean(r.slug) === normalizedSearch) || null;
      return found;
    } catch {
      return null;
    }
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

    return this.api.get<Recipe[]>(url).then((all) => {
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize);
      return {
        items,
        total: all.length,
      };
    });
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
