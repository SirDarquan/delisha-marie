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

  async getPage(slug: string): Promise<Page | null> {
    try {
      return await this.api.get<Page>(`/api/pages/${slug}`);
    } catch {
      return null;
    }
  }
}
