import { Injectable, inject } from '@angular/core';
import { Api } from '../../services/api';

export interface SearchResultRecipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  similarity: number;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly api = inject(Api);

  searchRecipes(query: string, page: number, pageSize: number) {
    if (!query) {
      return Promise.resolve({ items: [], total: 0 } as {
        items: SearchResultRecipe[];
        total: number;
      });
    }

    return this.api.post<{ items: SearchResultRecipe[]; total: number }>('/search', {
      query,
      page,
      pageSize,
    });
  }
}
