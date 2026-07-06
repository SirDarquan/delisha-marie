import { DOCUMENT, inject } from '@angular/core';
import { Api } from './services/api';

export function withRecipes() {
  return [
    {
      name: 'searchRecipes',
      description: 'Search for recipes on the site by keywords or semantics',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string' as const, description: 'The search query or concept' },
          page: { type: 'number' as const, description: 'The page number', default: 1 },
          pageSize: { type: 'number' as const, description: 'The page size', default: 12 },
        },
        required: ['query'],
      },
      execute: async (args: Record<string, unknown>) => {
        const api = inject(Api);
        const page = (args['page'] as number) || 1;
        const pageSize = (args['pageSize'] as number) || 12;
        const res = await api.post<{ items: Record<string, unknown>[]; total: number }>(
          '/api/recipes/search',
          {
            query: args['query'],
            page,
            pageSize,
          },
        );
        // Add fully-qualified URLs purely for the AI assistant
        const window = inject(DOCUMENT).defaultView;
        const origin =  window?.location.origin;
        const itemsWithUrl = res.items.map((r) => ({
          ...r,
          image:
            typeof r['image'] === 'string' && !r['image'].startsWith('https://')
              ? `${origin}${r['image']}`
              : r['image'],
          url: typeof r['slug'] === 'string' ? `${origin}/recipe/${r['slug']}` : '',
        }));

        // Return JSON string to the AI agent
        return JSON.stringify({ ...res, items: itemsWithUrl });
      },
    },
  ];
}
