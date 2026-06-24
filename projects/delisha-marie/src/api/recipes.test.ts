import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapQueryChain = (chain: any): any => {
    if (!chain || typeof chain !== 'object') return chain;
    if (chain instanceof Promise) return chain;
    return new Proxy(chain, {
      get(target, prop) {
        if (prop === 'then') {
          return target.then ? target.then.bind(target) : undefined;
        }
        if (prop in target) {
          const val = target[prop];
          if (typeof val === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (...args: any[]) => {
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
        const activeMockFrom = (globalThis as any).supabaseMockFrom || mockFrom;
        return wrapQueryChain(activeMockFrom(table));
      },
    })),
  };
});

import express from 'express';
import request from 'supertest';
import recipesRouter from './recipes';
import { resetSupabaseClient } from './supabase';

describe('Recipes Router API', () => {
  const app = express();
  app.use('/api', recipesRouter);

  let shouldFail = false;
  let mockIngredientsData: { id: string; name: string }[] = [];

  const mockRecipes = [
    { id: '1', title: 'Recipe 1', slug: 'r1', status: 'published', the_best: true },
    { id: '2', title: 'Recipe 2', slug: 'r2', status: 'published', the_best: false },
  ];

  beforeEach(() => {
    (globalThis as any).supabaseMockFrom = mockFrom;
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
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].title).toBe('Recipe 1');
    expect(res.body.items[0].method).toBe('Baking');
    expect(res.body.items[0].holidays).toEqual(['Christmas']);
    expect(res.body.items[0].specialDiets).toEqual(['Vegan']);
  });

  it('should filter by category and subcategory for recipes method', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'recipes', category: 'dinner', subcategory: 'pasta' });
    expect(res.status).toBe(200);
  });

  it('should filter by category only for recipes method', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'recipes', category: 'dinner' });
    expect(res.status).toBe(200);
  });

  it('should filter by category and subcategory for the-best-recipes method', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'the-best-recipes', category: 'dinner', subcategory: 'pasta' });
    expect(res.status).toBe(200);
  });

  it('should filter by category only for the-best-recipes method', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'the-best-recipes', category: 'dinner' });
    expect(res.status).toBe(200);
  });

  it('should filter by category for cooking methods', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'methods', category: 'baking' });
    expect(res.status).toBe(200);
  });

  it('should filter by category for special-diets', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'special-diets', category: 'vegan' });
    expect(res.status).toBe(200);
  });

  it('should filter by category for holidays', async () => {
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'holiday', category: 'christmas' });
    expect(res.status).toBe(200);
  });

  it('should filter by category and subcategory for tag method', async () => {
    mockIngredientsData = [{ id: 'ing-1', name: 'Apple' }];
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'tag', category: 'fruit', subcategory: 'apple' });
    expect(res.status).toBe(200);
  });

  it('should filter by category only for tag method including child ingredients prefix match', async () => {
    mockIngredientsData = [{ id: 'ing-1', name: 'Apple' }];
    const res = await request(app).get('/api/recipes').query({ method: 'tag', category: 'apple' });
    expect(res.status).toBe(200);
  });

  it('should return 500 when database query fails', async () => {
    shouldFail = true;
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Query failed');
  });

  it('should filter by special-diet (singular) and holidays (plural)', async () => {
    const res1 = await request(app)
      .get('/api/recipes')
      .query({ method: 'special-diet', category: 'vegan' });
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .get('/api/recipes')
      .query({ method: 'holidays', category: 'christmas' });
    expect(res2.status).toBe(200);
  });

  it('should handle tag method when category ingredient is not found', async () => {
    mockIngredientsData = []; // not found
    const res = await request(app)
      .get('/api/recipes')
      .query({ method: 'tag', category: 'unknown-tag' });
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

    const res = await request(app).get('/api/recipes').query({ method: 'tag', category: 'apple' });
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

    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body.items[0].holidays).toEqual([]);
    expect(res.body.items[0].specialDiets).toEqual([]);
    expect(res.body.items[0].method).toBe('');
    expect(res.body.items[0].nestedData.arrayField[2].deepKey).toBe('val');
    expect(res.body.items[0].nestedData.primitiveField).toBe('hello');
  });

  it('should return 500 and handle non-Error string exceptions', async () => {
    mockFrom.mockImplementation(() => {
      throw 'String exception';
    });
    const res = await request(app).get('/api/recipes');
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
      const res = await request(app).get('/api/recipes');
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

    const res = await request(app)
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

      const res = await request(app).get('/api/recipes/r1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('1');
      expect(res.body.title).toBe('Recipe 1');
      expect(res.body.rating).toBe(5);
      expect(res.body.comments).toEqual([]);
      expect(res.body.breadcrumbs.main).toBe(0);
      expect(res.body.breadcrumbs.items).toHaveLength(1);
      expect(res.body.breadcrumbs.items[0]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'Recipes', url: '/recipes' },
        { label: 'Dinner', url: '/recipes/dinner' },
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

      const res = await request(app).get('/api/recipes/nonexistent');
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

      const res = await request(app).get('/api/recipes/error');
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

      const res = await request(app).get('/api/recipes/r2');
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

      const res = await request(app).get('/api/recipes/r4');
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

      const res = await request(app).get('/api/recipes/r5');
      expect(res.status).toBe(200);
      expect(res.body.breadcrumbs.items[0]).toEqual([
        { label: 'Home', url: '/' },
        { label: 'The Best Recipes', url: '/the-best-recipes' },
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
        const res = await request(app).get('/api/recipes/r1');
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

      const res = await request(app).get('/api/recipes/r3');
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
      const mockSingleDbRecipe = {
        id: '1',
        slug: 'r1',
        status: 'published',
        created_at: '2026-06-22',
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'categories') {
          return {
            select: () => Promise.resolve({ data: null, error: new Error('Cats error') }),
          };
        }
        if (table === 'recipe_categories') {
          return {
            select: () => {
              const queryChain = {
                eq: () => Promise.resolve({ data: null, error: new Error('Cats error') }),
              };
              return queryChain;
            },
          };
        }
        return {
          select: () => {
            const queryChain = {
              eq: () => queryChain,
              maybeSingle: () => Promise.resolve({ data: mockSingleDbRecipe, error: null }),
            };
            return queryChain;
          },
        };
      });

      const res = await request(app).get('/api/recipes/r1');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Cats error');
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

      const res = await request(app).get('/api/recipes/r1');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Adjacent query error');
    });
  });
});
