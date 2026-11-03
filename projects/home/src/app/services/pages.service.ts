import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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
  private readonly http = inject(HttpClient);
  private readonly pageCache = new Map<string, Promise<Page | null>>();

  getPage(slug: string): Promise<Page | null> {
    const cleanSlug = slug.startsWith('home:') ? slug.slice(5) : slug;
    const namespacedSlug = `home:${cleanSlug}`;

    let cached = this.pageCache.get(namespacedSlug);
    if (!cached) {
      cached = firstValueFrom(this.http.get<Page>(`/api/pages/${namespacedSlug}`)).catch(
        () => null,
      );
      this.pageCache.set(namespacedSlug, cached);

      setTimeout(() => {
        this.pageCache.delete(namespacedSlug);
      }, 5000);
    }
    return cached;
  }
}
