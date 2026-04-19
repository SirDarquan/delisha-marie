import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecipeIndexResponse } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class RecipeIndexService {
  private readonly http = inject(HttpClient);

  getData(): Observable<RecipeIndexResponse> {
    return this.http.get<RecipeIndexResponse>('/api/recipe-index');
  }
}
