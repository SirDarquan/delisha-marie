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

  private readonly searchCache = new Map<
    string,
    { timestamp: number; promise: Promise<{ items: SearchResultRecipe[]; total: number }> }
  >();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  searchRecipes(
    query: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: SearchResultRecipe[]; total: number }> {
    const trimmedQuery = query?.trim() || '';
    if (!trimmedQuery) {
      return Promise.resolve({ items: [], total: 0 });
    }

    const cacheKey = `${trimmedQuery.toLowerCase()}_${page}_${pageSize}`;
    const cached = this.searchCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.promise;
    }

    const promise = this.api
      .post<{ items: SearchResultRecipe[]; total: number }>('/search', {
        query: trimmedQuery,
        page,
        pageSize,
      })
      .catch((err) => {
        this.searchCache.delete(cacheKey);
        throw err;
      });

    this.searchCache.set(cacheKey, { timestamp: now, promise });
    return promise;
  }

  prefetchSearch(query: string, page: number, pageSize: number): void {
    if (!query?.trim()) return;
    void this.searchRecipes(query, page, pageSize);
  }
}
