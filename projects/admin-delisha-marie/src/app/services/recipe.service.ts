import { computed, inject, Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly api = inject(ApiService);

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
    this.loadInitialMethods();
    this.loadInitialHolidays();
    this.loadInitialSpecialDiets();
  }

  // State Restoration Methods
  private _lastScrollOffset = 0;
  private _lastActiveRecipeId: string | number | null = null;

  setLastScrollOffset(offset: number): void {
    this._lastScrollOffset = offset;
  }

  getLastScrollOffset(): number {
    return this._lastScrollOffset;
  }

  setLastActiveRecipeId(id: string | number | null): void {
    this._lastActiveRecipeId = id;
  }

  getLastActiveRecipeId(): string | number | null {
    return this._lastActiveRecipeId;
  }

  private _cachedRecipesList: Recipe[] = [];

  getCachedRecipesList(): Recipe[] {
    return this._cachedRecipesList;
  }

  setCachedRecipesList(recipes: Recipe[]): void {
    this._cachedRecipesList = recipes;
  }

  fetchRecipes(offset?: number, limit?: number, search?: string): Promise<Recipe[]> {
    let url = '/recipes';
    const params = new URLSearchParams();

    if (offset !== undefined) params.append('offset', offset.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    if (search) params.append('search', search);

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return this.api.get<Recipe[]>(url);
  }

  fetchRecipeById(id: string | number): Promise<Recipe> {
    return this.api.get<Recipe>(`/recipes/${id}`);
  }

  createRecipe(newRecipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    const id = crypto.randomUUID();
    const recipe: Recipe = {
      ...newRecipe,
      id,
    };

    return this.api.post<Recipe>('/recipes', recipe);
  }

  updateRecipe(id: string | number, updatedRecipe: Partial<Recipe>): Promise<Recipe> {
    const payloadWithoutId = { ...updatedRecipe };
    delete payloadWithoutId.id;
    return this.api.put<Recipe>(`/recipes/${id}`, payloadWithoutId);
  }

  deleteRecipe(id: string | number): Promise<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/recipes/${id}`);
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
