import { Injectable, inject } from '@angular/core';
import { Api } from './api';

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  description?: string;
  keywords?: string[];
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class PagesService {
  private readonly api = inject(Api);
  private readonly pageCache = new Map<string, Promise<Page | null>>();

  getPage(slug: string): Promise<Page | null> {
    const cleanSlug = slug.startsWith('kitchen:') ? slug.slice(8) : slug;
    const namespacedSlug = `kitchen:${cleanSlug}`;

    let cached = this.pageCache.get(namespacedSlug);
    if (!cached) {
      cached = this.api.get<Page>(`/pages/${namespacedSlug}`).catch(() => null);
      this.pageCache.set(namespacedSlug, cached);

      // Simple deduplication cache to prevent multiple parallel requests during resolvers
      setTimeout(() => {
        this.pageCache.delete(namespacedSlug);
      }, 5000);
    }
    return cached;
  }
}
