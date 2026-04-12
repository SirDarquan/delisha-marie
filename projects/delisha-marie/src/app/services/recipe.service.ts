import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, retry } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly http = inject(HttpClient);

  // Fetch recipes as a signal
  readonly recipes = toSignal(
    this.http.get<Recipe[]>('/api/recipes').pipe(
      retry(2),
      map((data) => data),
    ),
    { initialValue: [] as Recipe[] },
  );
}
