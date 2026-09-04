import { Injectable, inject, resource } from '@angular/core';
import { RecipeIndexResponse } from '../../models/category';
import { Api } from '../../services/api';

@Injectable({
  providedIn: 'root',
})
export class RecipeIndexService {
  private readonly api = inject(Api);

  private cachedData: Promise<RecipeIndexResponse> | null = null;

  /**
   * Returns a Promise of the recipe index data, caching it for the session.
   * Kept for backwards compatibility with recipe-list.ts and tests.
   */
  getData(): Promise<RecipeIndexResponse> {
    this.cachedData ??= this.api.get<RecipeIndexResponse>('/recipe-index').catch((err) => {
      this.cachedData = null;
      throw err;
    });
    return this.cachedData;
  }

  /**
   * A shared resource that automatically deduplicates and caches the data
   * for the lifetime of the application.
   */
  readonly indexResource = resource({
    loader: () => this.getData(),
  });
}
