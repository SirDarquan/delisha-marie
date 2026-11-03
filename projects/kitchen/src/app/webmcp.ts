import { IMAGE_LOADER } from '@angular/common';
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
        const imageLoader = inject(IMAGE_LOADER, { optional: true });
        const window = inject(DOCUMENT).defaultView;
        const origin = window?.location.origin;

        const res = await api.post<{ items: Recipe[]; total: number }>('/search', {
          query: query || '',
          page,
          pageSize,
        });
        // Add fully-qualified URLs purely for the AI assistant
        const itemsWithUrl = res.items.map((r) => {
          let imageUrl = r.image;
          if (
            imageUrl &&
            typeof imageUrl === 'string' &&
            !imageUrl.startsWith('http://') &&
            !imageUrl.startsWith('https://')
          ) {
            const path = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
            imageUrl = imageLoader
              ? imageLoader({ src: imageUrl, width: 300 })
              : `${origin}${path}`;
          }

          return {
            ...r,
            image: imageUrl,
            url: `${origin}/recipe/${r.slug}`,
          };
        });

        // Return JSON string to the AI agent
        return JSON.stringify({ ...res, items: itemsWithUrl });
      },
    },
  ];
}
