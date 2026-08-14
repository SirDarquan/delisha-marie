import { DOCUMENT, inject } from '@angular/core';
import { Api } from './services/api';
import type { Recipe } from './services/recipe.service';

export function withRecipes() {
  return [
    {
      name: 'searchRecipes',
      description: 'Search for recipes on the site by keywords or semantics',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string' as const,
            description: 'The search query. Leave empty to return all.',
          },
          page: {
            type: 'number' as const,
            description: 'Page number.',
            default: 1,
          },
          pageSize: {
            type: 'number' as const,
            description: 'Results per page.',
            default: 12,
          },
        },
      },
      execute: async ({
        query,
        page = 1,
        pageSize = 12,
      }: {
        query?: string;
        page?: number;
        pageSize?: number;
      }) => {
        const api = inject(Api);
        const window = inject(DOCUMENT).defaultView;
        const origin = window?.location.origin;

        const res = await api.post<{ items: Recipe[]; total: number }>('/search', {
          query: query || '',
          page,
          pageSize,
        });
        // Add fully-qualified URLs purely for the AI assistant
        const itemsWithUrl = res.items.map((r) => ({
          ...r,
          image:
            r.image && typeof r.image === 'string' && !r.image.startsWith('https://')
              ? `${origin}${r.image}`
              : r.image,
          url: `${origin}/recipe/${r.slug}`,
        }));

        // Return JSON string to the AI agent
        return JSON.stringify({ ...res, items: itemsWithUrl });
      },
    },
  ];
}
