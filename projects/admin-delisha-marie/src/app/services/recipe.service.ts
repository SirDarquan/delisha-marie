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

  // Core state: signal of all methods from database
  private readonly _methods = signal<{ id: string; name: string; slug: string }[]>([]);
  readonly methods = computed(() => this._methods());

  // Core state: signal of all holidays from database
  private readonly _holidays = signal<{ id: string; name: string }[]>([]);
  readonly holidays = computed(() => this._holidays());

  // Core state: signal of all special diets from database
  private readonly _specialDiets = signal<{ id: string; name: string }[]>([]);
  readonly specialDiets = computed(() => this._specialDiets());

  constructor() {
    this.loadInitialRecipes();
    this.loadInitialMethods();
    this.loadInitialHolidays();
    this.loadInitialSpecialDiets();
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

    // Default to loading from the main public assets recipes.json
    this.api
      .get<Recipe[]>('/recipes.json')
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
    const id = all.length
      ? Math.max(...all.map((r) => (typeof r.id === 'number' ? r.id : 0))) + 1
      : 1;
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

  private loadInitialMethods(): void {
    this.api
      .get<{ id: string; name: string; slug: string }[]>('/methods')
      .then((data) => {
        if (data && Array.isArray(data)) {
          this._methods.set(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load methods:', err);
      });
  }

  private loadInitialHolidays(): void {
    this.api
      .get<{ id: string; name: string }[]>('/holidays')
      .then((data) => {
        if (data && Array.isArray(data)) {
          this._holidays.set(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load holidays:', err);
      });
  }

  private loadInitialSpecialDiets(): void {
    this.api
      .get<{ id: string; name: string }[]>('/special-diets')
      .then((data) => {
        if (data && Array.isArray(data)) {
          this._specialDiets.set(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load special diets:', err);
      });
  }
}
