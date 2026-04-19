import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RecipeIndexResponse, Category } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class RecipeIndexService {
  private readonly http = inject(HttpClient);

  getFeaturedCategories(): Observable<Category[]> {
    return this.http
      .get<RecipeIndexResponse>('/api/recipe-index')
      .pipe(map((response) => response.featuredCategories));
  }
}
