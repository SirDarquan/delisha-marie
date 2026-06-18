import { computed, inject, Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly api = inject(ApiService);

  // Core state: signal of all recipes.
  private readonly _recipes = signal<Recipe[]>([]);
  readonly recipes = computed(() => this._recipes());

  constructor() {
    this.loadInitialRecipes();
  }

  private loadInitialRecipes(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_recipes');
      if (stored) {
        try {
          this._recipes.set(JSON.parse(stored));
          return;
        } catch {
          // fallback to fetching if JSON is malformed
        }
      }
    }

    // Default to loading from the backend recipes endpoint
    this.api
      .get<Recipe[]>('/recipes')
      .then((data) => {
        if (data.length) {
          this._recipes.set(data);
          this.saveToStorage(data);
        }
      })
      .catch(() => {
        // Fallback or empty if not accessible
        this._recipes.set([]);
      });
  }

  private saveToStorage(data: Recipe[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', JSON.stringify(data));
    }
  }

  getRecipes(): Recipe[] {
    return this._recipes();
  }

  getRecipeByIdOrSlug(val: string): Recipe | null {
    const cleanVal = val.replace(/^\/?recipe\//, '').replace(/^\//, '');
    const all = this._recipes();
    return (
      all.find(
        (r) =>
          String(r.id) === val ||
          r.slug.replace(/^\/?recipe\//, '').replace(/^\//, '') === cleanVal,
      ) || null
    );
  }

  createRecipe(newRecipe: Omit<Recipe, 'id'>): Recipe {
    const all = this._recipes();
    const id = crypto.randomUUID();
    const recipe: Recipe = {
      ...newRecipe,
      id,
    };

    const updated = [...all, recipe];
    this._recipes.set(updated);
    this.saveToStorage(updated);

    this.api
      .post<Recipe>('/recipes', recipe)
      .then((res) => console.log('Recipe created on backend', res))
      .catch((err: unknown) => console.error('Backend createRecipe error:', err));

    return recipe;
  }

  updateRecipe(id: string | number, updatedRecipe: Partial<Recipe>): Recipe | null {
    const all = this._recipes();
    const index = all.findIndex((r) => String(r.id) === String(id));
    if (index === -1) return null;

    const current = all[index];
    const updated: Recipe = {
      ...current,
      ...updatedRecipe,
      id: current.id, // Ensure ID remains immutable
    };

    const nextRecipes = [...all];
    nextRecipes[index] = updated;

    this._recipes.set(nextRecipes);
    this.saveToStorage(nextRecipes);

    const payloadWithoutId = { ...updated } as Partial<Recipe>;
    delete payloadWithoutId.id;
    this.api
      .put<Recipe>(`/recipes/${id}`, payloadWithoutId)
      .then((res) => console.log('Recipe updated on backend', res))
      .catch((err: unknown) => console.error('Backend updateRecipe error:', err));

    return updated;
  }

  deleteRecipe(id: string | number): boolean {
    const all = this._recipes();
    const filtered = all.filter((r) => String(r.id) !== String(id));
    if (filtered.length === all.length) return false;

    this._recipes.set(filtered);
    this.saveToStorage(filtered);

    this.api
      .delete<{ success: boolean }>(`/recipes/${id}`)
      .then(() => console.log('Recipe deleted on backend'))
      .catch((err: unknown) => console.error('Backend deleteRecipe error:', err));

    return true;
  }
}
