import { Injectable, inject, resource, computed } from '@angular/core';
import { Api } from './api';

export interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  featured: boolean;
  slug: string;
  theBest?: boolean;
  method?: string;
  specialDiets?: string[];
  holidays?: string[];
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
}
