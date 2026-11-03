import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

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
  private readonly api = inject(ApiService);

  async getPages(): Promise<Page[]> {
    return this.api.get<Page[]>('/pages');
  }

  async getPage(slug: string): Promise<Page> {
    return this.api.get<Page>(`/pages/${slug}`);
  }

  async savePage(slug: string, pageData: Partial<Page>): Promise<Page> {
    return this.api.put<Page>(`/pages/${slug}`, pageData);
  }
}
