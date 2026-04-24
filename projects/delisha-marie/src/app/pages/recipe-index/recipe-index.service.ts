import { Injectable, inject } from '@angular/core';
import { RecipeIndexResponse } from '../../models/category';
import { Api } from '../../services/api';

@Injectable({
  providedIn: 'root',
})
export class RecipeIndexService {
  private readonly api = inject(Api);

  /**
   * Returns a Promise of the recipe index data.
   */
  getData(): Promise<RecipeIndexResponse> {
    return this.api.get<RecipeIndexResponse>('/api/recipe-index');
  }
}
