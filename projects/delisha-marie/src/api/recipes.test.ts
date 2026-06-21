import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import express from 'express';
import request from 'supertest';
import recipesRouter from './recipes';

describe('Recipes Router API', () => {
  let app: express.Express;
  let shouldFail = false;
  let mockIngredientsData: { id: string; name: string }[] = [];

  const mockRecipes = [
    { id: '1', title: 'Recipe 1', slug: 'r1', status: 'published', the_best: true },
    { id: '2', title: 'Recipe 2', slug: 'r2', status: 'published', the_best: false },
  ];

  beforeEach(() => {
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

    app = express();
    app.use('/api', recipesRouter);
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
});
