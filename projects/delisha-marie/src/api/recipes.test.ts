import { createRequestMock } from './test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockFrom, mockInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => {
  const wrapQueryChain = (chain: unknown): unknown => {
    if (!chain || typeof chain !== 'object') return chain;
    if (chain instanceof Promise) return chain;
    return new Proxy(chain as Record<string | symbol, unknown>, {
      get(target, prop) {
        if (prop === 'then') {
          return target['then']
            ? (target['then'] as (...args: unknown[]) => unknown).bind(target)
            : undefined;
        }
        if (prop in target) {
          const val = target[prop];
          if (typeof val === 'function') {
            return (...args: unknown[]) => {
              const res = val.apply(target, args);
              return wrapQueryChain(res);
            };
          }
          return val;
        }
        // Fallback for missing methods (returns a function that returns the proxied chain itself)
        return () => wrapQueryChain(target);
      },
    });
  };

  return {
    createClient: vi.fn(() => ({
      from: (table: string) => {
        const activeMockFrom =
          (globalThis as typeof globalThis & { supabaseMockFrom?: (table: string) => unknown })
            .supabaseMockFrom || mockFrom;
        return wrapQueryChain(activeMockFrom(table));
      },
      functions: {
        invoke: mockInvoke,
      },
    })),
  };
});

import express from 'express';
import recipesRouter from './recipes';
import { resetSupabaseClient } from './supabase';

describe('Recipes Router API', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', (req, res, next) => {
    const parts = req.url.split('?')[0].split('/').filter(Boolean);
    if (parts[0] === 'recipes') {
      req.query['slug'] = parts.slice(1);
    }
    next();
  });
  app.use('/api', recipesRouter as unknown as import('express').RequestHandler);

  let shouldFail = false;
  let mockIngredientsData: { id: string; name: string }[] = [];

  const mockRecipes = [
    { id: '1', title: 'Recipe 1', slug: 'r1', status: 'published', the_best: true },
    { id: '2', title: 'Recipe 2', slug: 'r2', status: 'published', the_best: false },
  ];

  beforeEach(() => {
    (globalThis as typeof globalThis & { supabaseMockFrom?: unknown }).supabaseMockFrom = mockFrom;
    vi.clearAllMocks();
    shouldFail = false;
    mockIngredientsData = [];

    mockFrom.mockImplementation((table: string) => {
      return {
        select: () => {
          const resultPromise = (() => {
            if (shouldFail) {
              return Promise.resolve({ data: null, error: new Error('Query failed') });
            }

            if (table === 'recipes') {
              const formattedRecipes = mockRecipes.map((r) => ({
                ...r,
                recipe_categories: [{ categories: { name: 'Dinner', url: '/recipes/dinner' } }],
                recipe_methods: [{ methods: { name: 'Baking' } }],
                recipe_holidays: [{ holidays: { name: 'Christmas' } }],
                recipe_special_diets: [{ special_diets: { name: 'Vegan' } }],
              }));
              return Promise.resolve({
                data: formattedRecipes,
                error: null,
                count: mockRecipes.length,
              });
            }

            if (table === 'ingredients') {
              return Promise.resolve({ data: mockIngredientsData, error: null });
            }

            return Promise.resolve({ data: [], error: null });
          })();

          const queryChain = {
            eq: () => queryChain,
            or: () => queryChain,
            in: () => queryChain,
            order: () => queryChain,
            range: () => queryChain,
            maybeSingle: () => {
              if (table === 'ingredients') {
                return Promise.resolve({ data: mockIngredientsData[0] || null, error: null });
              }
              return Promise.resolve({ data: null, error: null });
            },
            then: (onfulfilled?: (value: unknown) => unknown) => resultPromise.then(onfulfilled),
          };

          return queryChain;
        },
      };
    });
  });

  it('should fetch recipes with default pagination', async () => {
    const res = await createRequestMock(recipesRouter)().get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].title).toBe('Recipe 1');
    expect(res.body.items[0].method).toBe('Baking');
    expect(res.body.items[0].holidays).toEqual(['Christmas']);
    expect(res.body.items[0].specialDiets).toEqual(['Vegan']);
  });

  it('should filter by category and subcategory for recipes method', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'recipes', category: 'dinner', subcategory: 'pasta' });
    expect(res.status).toBe(200);
  });

  it('should filter by category only for recipes method', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'recipes', category: 'dinner' });
    expect(res.status).toBe(200);
  });

  it('should filter by category and subcategory for the-best-recipes method', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'the-best-recipes', category: 'dinner', subcategory: 'pasta' });
    expect(res.status).toBe(200);
  });

  it('should filter by category only for the-best-recipes method', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'the-best-recipes', category: 'dinner' });
    expect(res.status).toBe(200);
  });

  it('should filter by rating for the-best-recipes method with no category', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'the-best-recipes', rating: 'true' });
    expect(res.status).toBe(200);
  });

  it('should filter by category for cooking methods', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'methods', category: 'baking' });
    expect(res.status).toBe(200);
  });

  it('should filter by category for special-diets', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'special-diets', category: 'vegan' });
    expect(res.status).toBe(200);
  });

  it('should filter by category for holidays', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'holiday', category: 'christmas' });
    expect(res.status).toBe(200);
  });

  it('should filter by category and subcategory for tag method', async () => {
    mockIngredientsData = [{ id: 'ing-1', name: 'Apple' }];
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'tag', category: 'fruit', subcategory: 'apple' });
    expect(res.status).toBe(200);
  });

  it('should filter by category only for tag method including child ingredients prefix match', async () => {
    mockIngredientsData = [{ id: 'ing-1', name: 'Apple' }];
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'tag', category: 'apple' });
    expect(res.status).toBe(200);
  });

  it('should handle null data for index route', async () => {
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'null-data' });
    expect(res.status).toBe(200);
  });
  it('should handle null data for adjacent recipes', async () => {
    const res = await createRequestMock(recipesRouter)().get('/api/recipes/r-null-adjacent');
    expect(res.status).toBe(200);
  });
  it('should handle null data for equipment', async () => {
    const res = await createRequestMock(recipesRouter)().get(
      '/api/recipes/123/equipment?nullData=1',
    );
    expect(res.status).toBe(200);
  });

  it('should return 500 when database query fails', async () => {
    shouldFail = true;
    const res = await createRequestMock(recipesRouter)().get('/api/recipes');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Query failed');
  });

  it('should filter by special-diet (singular) and holidays (plural)', async () => {
    const res1 = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'special-diet', category: 'vegan' });
    expect(res1.status).toBe(200);

    const res2 = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'holidays', category: 'christmas' });
    expect(res2.status).toBe(200);
  });

  it('should handle tag method when category ingredient is not found', async () => {
    mockIngredientsData = []; // not found
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'tag', category: 'unknown-tag' });
    expect(res.status).toBe(200);
  });

  it('should handle tag method when subcategory ingredient is not found', async () => {
    mockIngredientsData = []; // not found
    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'tag', category: 'fruit', subcategory: 'unknown-sub' });
    expect(res.status).toBe(200);
  });

  it('should handle tag method when parent ingredient is found but all ingredients fetch returns null', async () => {
    // Return parent ingredient for the first query, but then mockFrom needs to return null for the second query.
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      return {
        select: () => {
          const queryChain = {
            eq: () => queryChain,
            in: () => queryChain,
            order: () => queryChain,
            range: () => queryChain,
            maybeSingle: () => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ data: { id: 'ing-1', name: 'Apple' }, error: null });
              }
              return Promise.resolve({ data: null, error: null });
            },
            then: (onfulfilled?: (value: unknown) => unknown) => {
              const promise = (() => {
                if (table === 'ingredients') {
                  return Promise.resolve({ data: null, error: null });
                }
                return Promise.resolve({ data: [], error: null });
              })();
              return promise.then(onfulfilled);
            },
          };
          return queryChain;
        },
      };
    });

    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ method: 'tag', category: 'apple' });
    expect(res.status).toBe(200);
  });

  it('should handle recipes that have empty or missing relation fields and nested arrays/primitives', async () => {
    mockFrom.mockImplementation(() => {
      return {
        select: () => {
          const queryChain = {
            eq: () => queryChain,
            or: () => queryChain,
            order: () => queryChain,
            range: () => queryChain,
            then: (onfulfilled?: (value: unknown) => unknown) => {
              const minimalRecipe = {
                id: '3',
                title: 'Minimal Recipe',
                slug: 'minimal',
                status: 'published',
                recipe_ingredients: [{ ingredient_id: '1' }],
                method: 'Old Method',
                // nested structure to test array and primitive branches of camelCaseKeys:
                nested_data: {
                  array_field: [1, 2, { deep_key: 'val' }],
                  primitive_field: 'hello',
                },
              };
              return Promise.resolve({ data: [minimalRecipe], error: null, count: 1 }).then(
                onfulfilled,
              );
            },
          };
          return queryChain;
        },
      };
    });

    const res = await createRequestMock(recipesRouter)().get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body.items[0].holidays).toEqual([]);
    expect(res.body.items[0].specialDiets).toEqual([]);
    expect(res.body.items[0].method).toBe('Old Method');
    expect(res.body.items[0].nestedData.arrayField[2].deepKey).toBe('val');
    expect(res.body.items[0].nestedData.primitiveField).toBe('hello');
  });

  it('should return 500 and handle non-Error string exceptions', async () => {
    mockFrom.mockImplementation(() => {
      throw 'String exception';
    });
    const res = await createRequestMock(recipesRouter)().get('/api/recipes');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('String exception');
  });

  it('should return 500 when database client initialization fails', async () => {
    const originalUrl = process.env['SUPABASE_URL'];
    const originalKey = process.env['SUPABASE_KEY'];
    delete process.env['SUPABASE_URL'];
    delete process.env['SUPABASE_KEY'];

    resetSupabaseClient();

    try {
      const res = await createRequestMock(recipesRouter)().get('/api/recipes');
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Supabase URL and Key are required');
    } finally {
      resetSupabaseClient();
      if (originalUrl !== undefined) process.env['SUPABASE_URL'] = originalUrl;
      if (originalKey !== undefined) process.env['SUPABASE_KEY'] = originalKey;
    }
  });

  it('should cover the false branch of method === tag check', async () => {
    mockFrom.mockImplementation(() => {
      return {
        select: () => {
          const queryChain = {
            eq: () => queryChain,
            order: () => queryChain,
            range: () => queryChain,
            then: (onfulfilled?: (value: unknown) => unknown) => {
              return Promise.resolve({ data: [], error: null, count: 0 }).then(onfulfilled);
            },
          };
          return queryChain;
        },
      };
    });

    const res = await createRequestMock(recipesRouter)()
      .get('/api/recipes')
      .query({ category: 'apple', method: 'nonexistent' });
    expect(res.status).toBe(200);
  });

  describe('GET /api/recipes/:slug', () => {
    it('should return a recipe by slug with breadcrumbs and navigation links', async () => {
      const mockSingleDbRecipe = {
        id: '1',
        title: 'Recipe 1',
        slug: 'r1',
        status: 'published',
        created_at: '2026-06-22T08:00:00Z',
        recipe_categories: [
          { categories: { id: 'c1', name: 'Dinner', url: '/recipes/dinner' } },
          { categories: { id: 'c2', name: 'Pasta', url: '/recipes/dinner/pasta' } },
        ],
        recipe_methods: [{ methods: { name: 'Baking' } }],
        recipe_holidays: [{ holidays: { name: 'Christmas' } }],
        recipe_special_diets: [{ special_diets: { name: 'Vegan' } }],
      };

      const mockCategories = [
        { name: 'Dinner', url: '/recipes/dinner' },
        { name: 'Pasta', url: '/recipes/dinner/pasta' },
      ];

      const mockPrevRecipe = {
        id: '0',
        title: 'Prev Title',
        slug: 'prev-slug',
        created_at: '2026-06-22T07:00:00Z',
      };
      const mockNextRecipe = {
        id: '2',
        title: 'Next Title',
        slug: 'next-slug',
        created_at: '2026-06-22T09:00:00Z',
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'categories') {
          return {
            select: () => Promise.resolve({ data: mockCategories, error: null }),
          };
        }
        if (table === 'recipe_categories') {
          const queryChain = {
            select: () => queryChain,
            eq: () => queryChain,
            then: (onfulfilled?: (value: unknown) => unknown) => {
              return Promise.resolve({
                data: mockSingleDbRecipe.recipe_categories,
                error: null,
              }).then(onfulfilled);
            },
          };
          return queryChain;
        }
        let isNext = false;
        const queryChain = {
          eq: () => queryChain,
          in: () => queryChain,
          order: () => queryChain,
          limit: () => queryChain,
          gt: () => {
            isNext = true;
            return queryChain;
          },
          lt: () => {
            isNext = false;
            return queryChain;
          },
          maybeSingle: () => Promise.resolve({ data: mockSingleDbRecipe, error: null }),
          then: (onfulfilled?: (value: unknown) => unknown) => {
            return Promise.resolve({
              data: isNext ? [mockNextRecipe] : [mockPrevRecipe],
              error: null,
            }).then(onfulfilled);
          },
        };
        return {
          select: () => queryChain,
        };
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/r1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('1');
      expect(res.body.title).toBe('Recipe 1');
      expect(res.body.rating).toBe(5);
      expect(res.body.comments).toEqual([]);
      expect(res.body.breadcrumbs.main).toBe(0);
      expect(res.body.breadcrumbs.items).toHaveLength(2);
      expect(res.body.breadcrumbs.items[0]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'Recipes', url: '/recipes' },
        { label: 'Dinner', url: '/recipes/dinner' },
        { label: 'Recipe 1', url: '/recipe/r1' },
      ]);
      expect(res.body.breadcrumbs.items[1]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'Recipes', url: '/recipes' },
        { label: 'Pasta', url: '/recipes/dinner/pasta' },
        { label: 'Recipe 1', url: '/recipe/r1' },
      ]);
      expect(res.body.navigation.prev.title).toBe('Prev Title');
      expect(res.body.navigation.prev.slug).toBe('/recipe/prev-slug');
      expect(res.body.navigation.next.title).toBe('Next Title');
      expect(res.body.navigation.next.slug).toBe('/recipe/next-slug');
    });

    it('should return null when recipe is not found', async () => {
      mockFrom.mockImplementation(() => {
        return {
          select: () => {
            const queryChain = {
              eq: () => queryChain,
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            };
            return queryChain;
          },
        };
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/nonexistent');
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    it('should return 500 when recipe query fails', async () => {
      mockFrom.mockImplementation(() => {
        return {
          select: () => {
            const queryChain = {
              eq: () => queryChain,
              maybeSingle: () => Promise.resolve({ data: null, error: new Error('Query error') }),
            };
            return queryChain;
          },
        };
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/error');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Query error');
    });

    it('should handle category deslugification fallback and theBest prefix checks', async () => {
      const mockSingleDbRecipe = {
        id: '2',
        title: 'Recipe 2',
        slug: 'r2',
        status: 'published',
        the_best: true,
        created_at: '2026-06-22T08:00:00Z',
        recipe_categories: [
          {
            categories: {
              id: 'c3',
              name: 'The Best Steak',
              url: '/the-best-recipes/the-best-dinner/steak',
            },
          },
        ],
        recipe_methods: [],
        recipe_holidays: [],
        recipe_special_diets: [],
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'categories') {
          return {
            select: () => Promise.resolve({ data: [], error: null }),
          };
        }
        if (table === 'recipe_categories') {
          const queryChain = {
            select: () => queryChain,
            eq: () => queryChain,
            then: (onfulfilled?: (value: unknown) => unknown) => {
              return Promise.resolve({
                data: mockSingleDbRecipe.recipe_categories,
                error: null,
              }).then(onfulfilled);
            },
          };
          return queryChain;
        }
        const queryChain = {
          eq: () => queryChain,
          in: () => queryChain,
          order: () => queryChain,
          maybeSingle: () => Promise.resolve({ data: mockSingleDbRecipe, error: null }),
          then: (onfulfilled?: (value: unknown) => unknown) => {
            return Promise.resolve({ data: [mockSingleDbRecipe], error: null }).then(onfulfilled);
          },
        };
        return {
          select: () => queryChain,
        };
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/r2');
      expect(res.status).toBe(200);
      expect(res.body.breadcrumbs.items[0]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'The Best Recipes', url: '/the-best-recipes' },
        { label: 'The Best Steak', url: '/the-best-recipes/the-best-dinner/steak' },
        { label: 'Recipe 2', url: '/recipe/r2' },
      ]);
    });

    it('should cover getBreadcrumbs fallback branches (null categories and invalid category objects)', async () => {
      const mockSingleDbRecipe = {
        id: '4',
        title: 'Recipe 4',
        slug: 'r4',
        status: 'published',
        the_best: true,
        created_at: '2026-06-22T08:00:00Z',
        recipe_categories: [
          {
            categories: null,
          },
          {
            categories: {
              id: 'c_bad',
              name: null,
              url: null,
            },
          },
        ],
        recipe_methods: [],
        recipe_holidays: [],
        recipe_special_diets: [],
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'recipe_categories') {
          const queryChain = {
            select: () => queryChain,
            eq: () => queryChain,
            then: (onfulfilled?: (value: unknown) => unknown) => {
              return Promise.resolve({
                data: null,
                error: null,
              }).then(onfulfilled);
            },
          };
          return queryChain;
        }
        const queryChain = {
          eq: () => queryChain,
          in: () => queryChain,
          order: () => queryChain,
          maybeSingle: () => Promise.resolve({ data: mockSingleDbRecipe, error: null }),
          then: (onfulfilled?: (value: unknown) => unknown) => {
            return Promise.resolve({ data: [], error: null }).then(onfulfilled);
          },
        };
        return {
          select: () => queryChain,
        };
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/r4');
      expect(res.status).toBe(200);
      expect(res.body.breadcrumbs.items[0]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'The Best Recipes', url: '/the-best-recipes' },
        { label: 'Recipe 4', url: '/recipe/r4' },
      ]);
    });

    it('should fallback to first category when recipe is theBest but has no theBest categories', async () => {
      const mockSingleDbRecipe = {
        id: '5',
        title: 'Recipe 5',
        slug: 'r5',
        status: 'published',
        the_best: true,
        created_at: '2026-06-22T08:00:00Z',
        recipe_categories: [
          {
            categories: {
              id: 'c4',
              name: 'Dinner',
              url: '/recipes/dinner',
            },
          },
          {
            categories: {
              id: 'c_invalid',
              name: null,
              url: '/recipes/invalid',
            },
          },
        ],
        recipe_methods: [],
        recipe_holidays: [],
        recipe_special_diets: [],
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'recipe_categories') {
          const queryChain = {
            select: () => queryChain,
            eq: () => queryChain,
            then: (onfulfilled?: (value: unknown) => unknown) => {
              return Promise.resolve({
                data: mockSingleDbRecipe.recipe_categories,
                error: null,
              }).then(onfulfilled);
            },
          };
          return queryChain;
        }
        const queryChain = {
          eq: () => queryChain,
          in: () => queryChain,
          order: () => queryChain,
          maybeSingle: () => Promise.resolve({ data: mockSingleDbRecipe, error: null }),
          then: (onfulfilled?: (value: unknown) => unknown) => {
            return Promise.resolve({ data: [], error: null }).then(onfulfilled);
          },
        };
        return {
          select: () => queryChain,
        };
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/r5');
      expect(res.status).toBe(200);
      expect(res.body.breadcrumbs.items[0]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'Recipes', url: '/recipes' },
        { label: 'Dinner', url: '/recipes/dinner' },
        { label: 'Recipe 5', url: '/recipe/r5' },
      ]);
    });

    it('should throw error on database client initialization error', async () => {
      const originalUrl = process.env['SUPABASE_URL'];
      const originalKey = process.env['SUPABASE_KEY'];
      delete process.env['SUPABASE_URL'];
      delete process.env['SUPABASE_KEY'];

      resetSupabaseClient();

      try {
        const res = await createRequestMock(recipesRouter)().get('/api/recipes/r1');
        expect(res.status).toBe(500);
        expect(res.body.error).toContain('Supabase URL and Key are required');
      } finally {
        resetSupabaseClient();
        if (originalUrl !== undefined) process.env['SUPABASE_URL'] = originalUrl;
        if (originalKey !== undefined) process.env['SUPABASE_KEY'] = originalKey;
      }
    });

    it('should handle recipe with no categories and null prev/next navigation', async () => {
      const mockSingleDbRecipe = {
        id: '3',
        title: 'Recipe 3',
        slug: 'r3',
        status: 'published',
        created_at: '2026-06-22T08:00:00Z',
        recipe_categories: [],
      };

      mockFrom.mockImplementation(() => {
        const queryChain = {
          eq: () => queryChain,
          in: () => queryChain,
          order: () => queryChain,
          maybeSingle: () => Promise.resolve({ data: mockSingleDbRecipe, error: null }),
          then: (onfulfilled?: (value: unknown) => unknown) => {
            return Promise.resolve({ data: [], error: null }).then(onfulfilled);
          },
        };
        return {
          select: () => queryChain,
        };
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/r3');
      expect(res.status).toBe(200);
      expect(res.body.breadcrumbs.items[0]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'Recipes', url: '/recipes' },
        { label: 'Recipe 3', url: '/recipe/r3' },
      ]);
      expect(res.body.navigation.prev).toBeNull();
      expect(res.body.navigation.next).toBeNull();
    });

    it('should return 500 when categories fetch fails', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'recipe_categories') {
          return {
            select: () => {
              const chain = {
                eq: () => chain,
                then: (onfulfilled?: (value: unknown) => unknown) => {
                  return Promise.resolve({ data: null, error: new Error('Cats error') }).then(
                    onfulfilled,
                  );
                },
              };
              return chain;
            },
          };
        }
        const queryChain = {
          eq: () => queryChain,
          in: () => queryChain,
          order: () => queryChain,
          maybeSingle: () =>
            Promise.resolve({
              data: { id: '1', slug: 'r1', status: 'published', title: 'T' },
              error: null,
            }),
          then: (onfulfilled?: (value: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(onfulfilled),
        };
        return { select: () => queryChain };
      });
      const res = await createRequestMock(recipesRouter)().get('/api/recipes/r1');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Cats error');
    });
  });

  describe('GET /api/recipes/favorites/list', () => {
    it('should fetch favorite recipes', async () => {
      mockFrom.mockImplementation(() => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          lte: () => chain,
          order: () => Promise.resolve({ data: [{ title: 'Fav1', slug: 'f1' }], error: null }),
        };
        return chain;
      });
      const res = await createRequestMock(recipesRouter)().get('/api/recipes/favorites/list');
      expect(res.status).toBe(200);
      expect(res.body.items[0].title).toBe('Fav1');
    });

    it('should return 500 on db error', async () => {
      mockFrom.mockImplementation(() => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          lte: () => chain,
          order: () => Promise.resolve({ data: null, error: new Error('db error') }),
        };
        return chain;
      });
      const res = await createRequestMock(recipesRouter)().get('/api/recipes/favorites/list');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/recipes/:slug/title', () => {
    it('should fetch title', async () => {
      mockFrom.mockImplementation(() => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          lte: () => chain,
          maybeSingle: () => Promise.resolve({ data: { title: 'T' }, error: null }),
        };
        return chain;
      });
      const res = await createRequestMock(recipesRouter)().get('/api/recipes/slug1/title');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('T');
    });

    it('should return 500 on error', async () => {
      mockFrom.mockImplementation(() => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          lte: () => chain,
          maybeSingle: () => Promise.resolve({ data: null, error: new Error('fail') }),
        };
        return chain;
      });
      const res = await createRequestMock(recipesRouter)().get('/api/recipes/slug1/title');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/recipes/:id/equipment', () => {
    it('should fetch equipment', async () => {
      mockFrom.mockImplementation(() => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: () => Promise.resolve({ data: [{ title: 'Eq1' }], error: null }),
        };
        return chain;
      });
      const res = await createRequestMock(recipesRouter)().get('/api/recipes/1/equipment');
      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe('Eq1');
    });

    it('should return 500 on error', async () => {
      mockFrom.mockImplementation(() => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: () => Promise.resolve({ data: null, error: new Error('fail') }),
        };
        return chain;
      });
      const res = await createRequestMock(recipesRouter)().get('/api/recipes/1/equipment');
      expect(res.status).toBe(500);
    });
  });

  it('should return 500 when adjacent recipes query fails', async () => {
    const mockSingleDbRecipe = {
      id: '1',
      slug: 'r1',
      status: 'published',
      created_at: '2026-06-22',
      recipe_categories: [{ categories: { id: 'c1', name: 'Dinner', url: '/recipes/dinner' } }],
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'categories') {
        return {
          select: () =>
            Promise.resolve({ data: [{ name: 'Dinner', url: '/recipes/dinner' }], error: null }),
        };
      }
      const queryChain = {
        eq: () => queryChain,
        in: () => queryChain,
        order: () => queryChain,
        maybeSingle: () => Promise.resolve({ data: mockSingleDbRecipe, error: null }),
        then: (onfulfilled?: (value: unknown) => unknown) => {
          return Promise.resolve({ data: null, error: new Error('Adjacent query error') }).then(
            onfulfilled,
          );
        },
      };
      return {
        select: () => queryChain,
      };
    });

    const res = await createRequestMock(recipesRouter)().get('/api/recipes/r1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Adjacent query error');
  });

  describe('GET /api/recipes/:recipeId/comments', () => {
    it('should return comments with pagination and default page size', async () => {
      const mockComments = Array.from({ length: 60 }, (_, i) => ({
        id: `c${i + 1}`,
        recipe_id: '123',
        parent_id: null,
        author: `Author ${i + 1}`,
        email: `author${i + 1}@example.com`,
        content: `Comment ${i + 1}`,
        created_at: new Date(2026, 0, i + 1).toISOString(),
      }));

      const mockReplies = [
        {
          id: 'r1',
          recipe_id: '123',
          parent_id: 'c59',
          author: 'Replier 1',
          email: 'replier1@example.com',
          content: 'Reply 1',
          created_at: new Date(2026, 0, 61).toISOString(),
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            select: vi.fn().mockImplementation((_selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: 60, error: null }),
                  }),
                };
              }
              return queryChain;
            }),
            eq: vi.fn().mockImplementation(() => queryChain),
            is: vi.fn().mockImplementation(() => queryChain),
            in: vi.fn().mockImplementation(() => queryChain),
            order: vi.fn().mockImplementation(() => queryChain),
            range: vi.fn().mockImplementation((start, end) => {
              const slice = mockComments.slice(start, end + 1);
              return Promise.resolve({ data: slice, error: null });
            }),
            then: vi.fn().mockImplementation((onfulfilled) => {
              return Promise.resolve({ data: mockReplies, error: null }).then(onfulfilled);
            }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(60);
      expect(res.body.comments).toHaveLength(51);
      expect(res.body.comments[0].id).toBe('c11');
      expect(res.body.comments[50].id).toBe('r1');
    });

    it('should handle errors in comments fetching', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          return {
            select: vi.fn().mockImplementation((selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: null, error: new Error('Db error') }),
                  }),
                };
              }
              return {};
            }),
          };
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Db error');
    });

    it('should return empty comments if total is 0', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            select: vi.fn().mockImplementation((_selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: 0, error: null }),
                  }),
                };
              }
              return queryChain;
            }),
            eq: vi.fn().mockImplementation(() => queryChain),
            is: vi.fn().mockImplementation(() => queryChain),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.comments).toEqual([]);
    });

    it('should handle specific page query parameter', async () => {
      const mockComments = Array.from({ length: 60 }, (_, i) => ({
        id: `c${i + 1}`,
        recipe_id: '123',
        parent_id: null,
        author: `Author ${i + 1}`,
        email: `author${i + 1}@example.com`,
        content: `Comment ${i + 1}`,
        created_at: new Date(2026, 0, i + 1).toISOString(),
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            select: vi.fn().mockImplementation((_selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: 60, error: null }),
                  }),
                };
              }
              return queryChain;
            }),
            eq: vi.fn().mockImplementation(() => queryChain),
            is: vi.fn().mockImplementation(() => queryChain),
            in: vi.fn().mockImplementation(() => queryChain),
            order: vi.fn().mockImplementation(() => queryChain),
            range: vi.fn().mockImplementation((start, end) => {
              const slice = mockComments.slice(start, end + 1);
              return Promise.resolve({ data: slice, error: null });
            }),
            then: vi.fn().mockImplementation((onfulfilled) => {
              return Promise.resolve({ data: [], error: null }).then(onfulfilled);
            }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments?page=1');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(60);
      expect(res.body.comments).toHaveLength(10);
      expect(res.body.comments[0].id).toBe('c1');
    });

    it('should handle non-Error string exceptions in comments fetching', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          return {
            select: vi.fn().mockImplementation(() => {
              throw 'String database crash';
            }),
          };
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('String database crash');
    });

    it('should handle fetchError in top-level comments query', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          return {
            select: vi.fn().mockImplementation((selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: 10, error: null }),
                  }),
                };
              }
              return {
                eq: () => ({
                  is: () => ({
                    order: () => ({
                      range: () =>
                        Promise.resolve({ data: null, error: new Error('Fetch comments failed') }),
                    }),
                  }),
                }),
              };
            }),
          };
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Fetch comments failed');
    });

    it('should handle null data in top-level comments query', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          return {
            select: vi.fn().mockImplementation((selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: 10, error: null }),
                  }),
                };
              }
              return {
                eq: () => ({
                  is: () => ({
                    order: () => ({
                      range: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              };
            }),
          };
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(200);
      expect(res.body.comments).toEqual([]);
    });

    it('should handle replyError in replies query', async () => {
      const mockComments = [{ id: 'c1', recipe_id: '123', parent_id: null }];
      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            select: vi.fn().mockImplementation((_selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: 1, error: null }),
                  }),
                };
              }
              return queryChain;
            }),
            eq: vi.fn().mockImplementation(() => queryChain),
            is: vi.fn().mockImplementation(() => queryChain),
            in: vi.fn().mockImplementation(() => queryChain),
            order: vi.fn().mockImplementation(() => queryChain),
            range: vi
              .fn()
              .mockImplementation(() => Promise.resolve({ data: mockComments, error: null })),
            then: vi.fn().mockImplementation((onfulfilled) => {
              return Promise.resolve({ data: null, error: new Error('Replies query failed') }).then(
                onfulfilled,
              );
            }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Replies query failed');
    });

    it('should handle null data in replies query', async () => {
      const mockComments = [{ id: 'c1', recipe_id: '123', parent_id: null }];
      mockFrom.mockImplementation((table: string) => {
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            select: vi.fn().mockImplementation((_selectString, options) => {
              if (options && options.count === 'exact') {
                return {
                  eq: () => ({
                    is: () => Promise.resolve({ count: 1, error: null }),
                  }),
                };
              }
              return queryChain;
            }),
            eq: vi.fn().mockImplementation(() => queryChain),
            is: vi.fn().mockImplementation(() => queryChain),
            in: vi.fn().mockImplementation(() => queryChain),
            order: vi.fn().mockImplementation(() => queryChain),
            range: vi
              .fn()
              .mockImplementation(() => Promise.resolve({ data: mockComments, error: null })),
            then: vi.fn().mockImplementation((onfulfilled) => {
              return Promise.resolve({ data: null, error: null }).then(onfulfilled);
            }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/comments');
      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(1);
    });
  });

  describe('POST /api/recipes/:recipeId/comments', () => {
    it('should successfully post a comment', async () => {
      const mockComment = {
        id: 'new',
        recipe_id: '123',
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome!',
        created_at: new Date().toISOString(),
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ key: 'require_comment_approval', value: 'false' }],
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            insert: vi.fn().mockImplementation(() => queryChain),
            select: vi.fn().mockImplementation(() => queryChain),
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome!',
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('new');
      expect(res.body.recipeId).toBe('123');
      expect(res.body.author).toBe('Tester');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Tester',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name, email, and content are required');
    });

    it('should return 400 if website contains blocked domain', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                { key: 'require_comment_approval', value: 'false' },
                { key: 'blocked_domains', value: 'delisha-marie' },
              ],
              error: null,
            }),
          };
        }
        return { select: vi.fn() };
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Bob',
        email: 'bob@example.com',
        content: 'Cool!',
        website: 'https://www.delisha-marie.com/blog',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Sorry, you cannot link to this website.');
    });

    it('should allow website if blocked_domains is not set', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ key: 'require_comment_approval', value: 'false' }],
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            insert: vi.fn().mockImplementation(() => queryChain),
            select: vi.fn().mockImplementation(() => queryChain),
            single: vi.fn().mockResolvedValue({ data: { id: 'allowed' }, error: null }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Bob',
        email: 'bob@example.com',
        content: 'Cool!',
        website: 'https://www.some-other-site.com',
      });

      expect(res.status).toBe(201);
    });

    it('should allow website if it does not match any blocked_domains', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                { key: 'require_comment_approval', value: 'false' },
                { key: 'blocked_domains', value: 'delisha-marie, bad-site.com' },
              ],
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            insert: vi.fn().mockImplementation(() => queryChain),
            select: vi.fn().mockImplementation(() => queryChain),
            single: vi.fn().mockResolvedValue({ data: { id: 'allowed' }, error: null }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Bob',
        email: 'bob@example.com',
        content: 'Cool!',
        website: 'https://www.some-other-site.com',
      });

      expect(res.status).toBe(201);
    });

    it('should handle insert errors', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ key: 'require_comment_approval', value: 'false' }],
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            insert: vi.fn().mockImplementation(() => queryChain),
            select: vi.fn().mockImplementation(() => queryChain),
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome!',
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Insert failed');
    });

    it('should successfully post a comment with all optional fields', async () => {
      const mockComment = {
        id: 'new-reply',
        recipe_id: '123',
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome reply!',
        rating: 5,
        website: 'https://tester.com',
        parent_id: 'c1',
        created_at: new Date().toISOString(),
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ key: 'require_comment_approval', value: 'false' }],
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            insert: vi.fn().mockImplementation(() => queryChain),
            select: vi.fn().mockImplementation(() => queryChain),
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome reply!',
        rating: 5,
        website: 'https://tester.com',
        parentId: 'c1',
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('new-reply');
      expect(res.body.rating).toBe(5);
      expect(res.body.website).toBe('https://tester.com');
      expect(res.body.parentId).toBe('c1');
    });

    it('should silently return 201 if honeypot (alt_email) is filled', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'spam_comments') {
          return {
            insert: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ key: 'require_comment_approval', value: 'false' }],
              error: null,
            }),
          };
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'SpamBot',
        email: 'spam@bot.com',
        content: 'Buy this!',
        alt_email: 'spambot@bot.com',
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^bot-/);
      expect(res.body.author).toBe('SpamBot');
      expect(mockFrom).toHaveBeenCalledWith('spam_comments');
      expect(mockFrom).not.toHaveBeenCalledWith('comments');
    });

    it('should set status to pending if moderation is enabled in site_settings', async () => {
      const mockComment = {
        id: 'new-pending',
        recipe_id: '123',
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome!',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ key: 'require_comment_approval', value: 'true' }],
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          const queryChain: Record<string, unknown> = {
            insert: vi.fn().mockImplementation(() => queryChain),
            select: vi.fn().mockImplementation(() => queryChain),
            single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome!',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
    });

    it('should handle non-Error string exceptions on insert', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ key: 'require_comment_approval', value: 'false' }],
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          return {
            insert: vi.fn().mockImplementation(() => {
              throw 'String insert crash';
            }),
          };
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().post('/api/recipes/123/comments').send({
        author: 'Tester',
        email: 'tester@example.com',
        content: 'Awesome!',
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('String insert crash');
    });
  });

  describe('GET /api/recipes/:recipeId/equipment', () => {
    it('should return equipment for a recipe', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment') {
          const queryChain: Record<string, unknown> = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'eq1', recipe_id: '123', title: 'Pan', url: 'http://pan', image: 'pan.jpg' },
              ],
              error: null,
            }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/equipment');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Pan');
    });

    it('should return 500 when database query fails for equipment', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment') {
          const queryChain: Record<string, unknown> = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Equipment error'),
            }),
          };
          return queryChain;
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/equipment');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Equipment error');
    });

    it('should handle non-Error string exceptions in equipment fetching', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment') {
          return {
            select: vi.fn().mockImplementation(() => {
              throw 'Equipment string crash';
            }),
          };
        }
        return {};
      });

      const res = await createRequestMock(recipesRouter)().get('/api/recipes/123/equipment');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Equipment string crash');
    });
  });
});
