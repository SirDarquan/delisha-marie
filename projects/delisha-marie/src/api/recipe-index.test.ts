import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
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
    })),
  };
});

import express from 'express';
import request from 'supertest';
import recipeIndexRouter from './recipe-index';
import { resetSupabaseClient } from './supabase';

describe('Recipe Index Router API', () => {
  let app: express.Express;

  // Control variables to trigger simulated query errors
  let shouldFailRecipes = false;
  let shouldFailCategories = false;
  let shouldFailMethods = false;
  let shouldFailHolidays = false;
  let shouldFailDiets = false;
  let shouldFailIngredients = false;
  let shouldFailCounts = false;
  let shouldThrowGeneric = false;

  const mockCategories = [
    { name: 'Appetizers', url: '/recipes/appetizers' },
    { name: 'Dips', url: '/recipes/appetizers/dips' },
    { name: 'Wings', url: '/recipes/appetizers/wings' },
    { name: 'Empty Category Slug', url: '/recipes/' },
    { name: 'Main Dishes', url: '/recipes/main-dishes' },
    { name: 'The Best Appetizers', url: '/the-best-recipes/the-best-appetizers' },
    { name: 'The Best Dips', url: '/the-best-recipes/the-best-appetizers/the-best-dips' },
    { name: 'The Best Wings', url: '/the-best-recipes/the-best-appetizers/the-best-wings' },
    { name: 'The Best Empty Category Slug', url: '/the-best-recipes/the-best-' },
    { name: 'The Best Main Dishes', url: '/the-best-recipes/the-best-main-dishes' },
    { name: null as unknown as string, url: '/recipes/invalid-cat' },
    { name: 'Invalid Cat Url', url: null as unknown as string },
    { name: 'Mismatched Segment', url: '/other-segment/appetizers' },
    { name: 'Short Url', url: '/recipes' },
    { name: 'Long Url', url: '/recipes/a/b/c/d' },
    null as unknown as { name: string; url: string },
  ];

  const mockRecipes = [
    {
      id: 'recipe-1',
      breadcrumbs: [
        {
          items: [
            { label: 'Home', url: '/' },
            { label: 'Appetizers', url: '/recipes/appetizers' },
            { label: 'Dips', url: '/recipes/appetizers/dips' },
            { label: 'Wings', url: '/recipes/appetizers/wings' },
          ],
        },
      ],
    },
    {
      id: 'recipe-2',
      breadcrumbs: [
        {
          items: [
            { label: 'Home', url: '/' },
            { label: 'Main Dishes', url: '/recipes/main-dishes' },
          ],
        },
      ],
    },
    {
      id: 'recipe-3',
      breadcrumbs: null, // Test edge case where breadcrumbs is null
    },
    {
      id: 'recipe-4',
      breadcrumbs: [
        {
          items: [
            { label: 'Invalid' }, // Test breadcrumb item without url/label match
            null, // Test null item
            { label: 'About', url: '/about' }, // Test item not starting with /recipes/
            { label: 'Short', url: '/recipes' }, // Test item with parts.length < 3
            { label: 'Long', url: '/recipes/a/b/c' }, // Test item with parts.length > 4
          ],
        },
        null, // Test null gp
        {
          items: null, // Test null items list in gp
        },
      ],
    },
    {
      id: 'recipe-5',
      breadcrumbs: [
        {
          items: [{ label: 'Empty Category Slug', url: '/recipes/' }],
        },
      ],
    },
  ];

  const mockMethods = [
    { name: 'Air Fryer', slug: 'air-fryer' },
    { name: 'Baking', slug: 'baking' },
    { name: null as unknown as string, slug: 'invalid-method' },
    { name: 'Invalid Method Slug', slug: null as unknown as string },
    null as unknown as { name: string; slug: string },
  ];

  const mockHolidays = [
    { name: 'Christmas', slug: 'christmas' },
    { name: 'Thanksgiving', slug: 'thanksgiving' },
    { name: null as unknown as string, slug: 'invalid-holiday' },
    { name: 'Invalid Holiday Slug', slug: null as unknown as string },
    null as unknown as { name: string; slug: string },
  ];

  const mockDiets = [
    { name: 'Gluten Free', slug: 'gluten-free' },
    { name: 'Vegan', slug: 'vegan' },
    { name: null as unknown as string, slug: 'invalid-diet' },
    { name: 'Invalid Diet Slug', slug: null as unknown as string },
    null as unknown as { name: string; slug: string },
  ];

  const mockIngredients = [
    { id: '1', name: 'Apple', slug: 'apple' },
    { id: '2', name: 'Apple Cider', slug: 'apple-cider' },
    { id: '4', name: 'Apple Juice', slug: 'apple-juice' },
    { id: '3', name: 'Baking Soda', slug: 'baking-soda' },
    { id: '5', name: 'Unused Ingredient', slug: 'unused-ingredient' },
  ];

  const mockRelations = [
    { recipe_id: 'recipe-1', ingredient_id: '1' },
    { recipe_id: 'recipe-1', ingredient_id: '2' },
    { recipe_id: 'recipe-1', ingredient_id: '4' },
    { recipe_id: 'recipe-2', ingredient_id: '3' },
    { recipe_id: 'recipe-99', ingredient_id: '1' }, // Test relation to non-published recipe ID
    { recipe_id: 'recipe-1', ingredient_id: '' }, // Test relation with empty ingredient_id
    { recipe_id: 'recipe-1', ingredient_id: null as unknown as string }, // Test relation with null ingredient_id
  ];

  beforeEach(() => {
    (globalThis as typeof globalThis & { supabaseMockFrom?: unknown }).supabaseMockFrom = mockFrom;
    resetSupabaseClient();
    vi.clearAllMocks();
    shouldFailRecipes = false;
    shouldFailCategories = false;
    shouldFailMethods = false;
    shouldFailHolidays = false;
    shouldFailDiets = false;
    shouldFailIngredients = false;
    shouldFailCounts = false;
    shouldThrowGeneric = false;

    mockFrom.mockImplementation((table: string) => {
      if (shouldThrowGeneric) {
        throw new Error('Generic database connection crash');
      }

      return {
        select: () => {
          const then = (
            onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown,
          ) => {
            if (table === 'ingredients' && shouldFailIngredients) {
              return Promise.resolve({
                data: null,
                error: new Error('Ingredients query error'),
              }).then(onfulfilled);
            }
            if (table === 'recipe_ingredients' && shouldFailCounts) {
              return Promise.resolve({ data: null, error: new Error('Counts query error') }).then(
                onfulfilled,
              );
            }

            let data: unknown = [];
            if (table === 'ingredients') data = mockIngredients;
            else if (table === 'recipe_ingredients') data = mockRelations;

            return Promise.resolve({ data, error: null }).then(onfulfilled);
          };

          return {
            eq: () => {
              const getResult = () => {
                if (table === 'categories') {
                  if (shouldFailCategories) {
                    return Promise.resolve({
                      data: null,
                      error: new Error('Categories query error'),
                    });
                  }
                  const mockData = mockCategories.map((c) => ({
                    name: c ? c.name : null,
                    url: c ? c.url : null,
                    recipe_categories: [{ recipes: { status: 'published' } }],
                  }));
                  return Promise.resolve({ data: mockData, error: null });
                }
                if (table === 'methods') {
                  if (shouldFailMethods) {
                    return Promise.resolve({
                      data: null,
                      error: new Error('Methods query error'),
                    });
                  }
                  const mockData = mockMethods.map((m) => ({
                    name: m ? m.name : null,
                    slug: m ? m.slug : null,
                    recipe_methods: [{ recipes: { status: 'published' } }],
                  }));
                  return Promise.resolve({ data: mockData, error: null });
                }
                if (table === 'holidays') {
                  if (shouldFailHolidays) {
                    return Promise.resolve({
                      data: null,
                      error: new Error('Holidays query error'),
                    });
                  }
                  const mockData = mockHolidays.map((h) => ({
                    name: h ? h.name : null,
                    slug: h ? h.slug : null,
                    recipe_holidays: [{ recipes: { status: 'published' } }],
                  }));
                  return Promise.resolve({ data: mockData, error: null });
                }
                if (table === 'special_diets') {
                  if (shouldFailDiets) {
                    return Promise.resolve({
                      data: null,
                      error: new Error('Special Diets query error'),
                    });
                  }
                  const mockData = mockDiets.map((d) => ({
                    name: d ? d.name : null,
                    slug: d ? d.slug : null,
                    recipe_special_diets: [{ recipes: { status: 'published' } }],
                  }));
                  return Promise.resolve({ data: mockData, error: null });
                }
                if (table === 'recipes' && shouldFailRecipes) {
                  return Promise.resolve({ data: null, error: new Error('Recipes query error') });
                }
                return Promise.resolve({ data: mockRecipes, error: null });
              };

              const promise = getResult();

              return {
                ilike: (_col: string, val: string) => {
                  const filterPrefix = val.replace(/%/g, '');
                  const filteredPromise = promise.then((res) => {
                    if (res.data && Array.isArray(res.data)) {
                      const filteredData = res.data.filter((row: unknown) => {
                        const rowTyped = row as {
                          url?: string | null;
                        } | null;
                        const url = rowTyped?.url;
                        return url && url.startsWith(filterPrefix);
                      });
                      return { data: filteredData, error: null };
                    }
                    return res;
                  });
                  return {
                    then: (
                      onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown,
                    ) => filteredPromise.then(onfulfilled),
                  };
                },
                then: (onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown) =>
                  promise.then(onfulfilled),
              };
            },
            then,
          };
        },
      };
    });

    app = express();
    app.use('/api', recipeIndexRouter);
  });

  describe('Supabase Client initialization', () => {
    it('should throw error when env variables are missing', async () => {
      const originalUrl = process.env['SUPABASE_URL'];
      delete process.env['SUPABASE_URL'];

      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Supabase URL and Key are required');

      process.env['SUPABASE_URL'] = originalUrl;
    });

    it('should throw error when SUPABASE_KEY is missing', async () => {
      const originalKey = process.env['SUPABASE_KEY'];
      delete process.env['SUPABASE_KEY'];

      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Supabase URL and Key are required');

      process.env['SUPABASE_KEY'] = originalKey;
    });
  });

  describe('GET /recipe-index success flow', () => {
    it('should successfully return the full categorization mapping with child categories and ingredients nested', async () => {
      const res = await request(app).get('/api/recipe-index');

      expect(res.status).toBe(200);

      // Verify categoriesList nesting
      const categoryList = res.body.categoriesList;
      expect(categoryList).toHaveLength(3);
      expect(categoryList[0].name).toBe('Appetizers');
      expect(categoryList[0].children).toHaveLength(2);
      expect(categoryList[0].children[0].name).toBe('Dips');
      expect(categoryList[0].children[0].url).toBe('/recipes/appetizers/dips');
      expect(categoryList[0].children[1].name).toBe('Wings');
      expect(categoryList[0].children[1].url).toBe('/recipes/appetizers/wings');

      expect(categoryList[1].name).toBe('Empty Category Slug');
      expect(categoryList[1].url).toBe('/recipes/');

      expect(categoryList[2].name).toBe('Main Dishes');
      expect(categoryList[2].children).toBeUndefined(); // Main Dishes has no subcategory level 4 breadcrumbs in mockup

      // Verify cooking methods
      expect(res.body.cookingMethods).toHaveLength(2);
      expect(res.body.cookingMethods[0].name).toBe('Air Fryer');
      expect(res.body.cookingMethods[1].name).toBe('Baking');

      // Verify holidays
      expect(res.body.holidays).toHaveLength(2);
      expect(res.body.holidays[0].name).toBe('Christmas');
      expect(res.body.holidays[1].name).toBe('Thanksgiving');

      // Verify special diets
      expect(res.body.specialDiets).toHaveLength(2);
      expect(res.body.specialDiets[0].name).toBe('Gluten Free');
      expect(res.body.specialDiets[1].name).toBe('Vegan');

      // Verify best recipes
      const theBest = res.body.bestRecipes;
      expect(theBest).toHaveLength(3);
      expect(theBest[0].name).toBe('The Best Appetizers');
      expect(theBest[0].url).toBe('/the-best-recipes/the-best-appetizers');
      expect(theBest[0].children).toHaveLength(2);
      expect(theBest[0].children[0].name).toBe('The Best Dips');
      expect(theBest[0].children[0].url).toBe(
        '/the-best-recipes/the-best-appetizers/the-best-dips',
      );

      expect(theBest[1].name).toBe('The Best Empty Category Slug');
      expect(theBest[1].url).toBe('/the-best-recipes/the-best-');

      expect(theBest[2].name).toBe('The Best Main Dishes');
      expect(theBest[2].url).toBe('/the-best-recipes/the-best-main-dishes');

      // Verify ingredients prefix matching nesting
      const ingredients = res.body.ingredients;
      expect(ingredients).toHaveLength(2); // "Apple" (parent containing children) and "Baking Soda"
      expect(ingredients[0].name).toBe('Apple');
      expect(ingredients[0].children).toHaveLength(2);
      expect(ingredients[0].children[0].name).toBe('Apple Cider');
      expect(ingredients[0].children[0].count).toBe(1); // Mapped once to recipe-1
      expect(ingredients[0].children[1].name).toBe('Apple Juice');
      expect(ingredients[0].children[1].count).toBe(1);
      expect(ingredients[1].name).toBe('Baking Soda');
    });

    it('should successfully handle null and empty values from database tables', async () => {
      // Modify mockFrom temporarily for this test to return null data
      mockFrom.mockImplementation(() => {
        return {
          select: () => {
            const then = (
              onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown,
            ) => {
              return Promise.resolve({ data: null, error: null }).then(onfulfilled);
            };
            return {
              eq: () => ({
                ilike: () => ({
                  eq: () => Promise.resolve({ data: null, error: null }),
                  then: (
                    onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown,
                  ) => Promise.resolve({ data: null, error: null }).then(onfulfilled),
                }),
                then,
              }),
              then,
            };
          },
        };
      });

      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(200);
      expect(res.body.cookingMethods).toEqual([]);
      expect(res.body.holidays).toEqual([]);
      expect(res.body.specialDiets).toEqual([]);
      expect(res.body.ingredients).toEqual([]);
    });
  });

  describe('GET /recipe-index error flows', () => {
    it('should return 500 when recipes query fails', async () => {
      shouldFailRecipes = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Recipes query error');
    });

    it('should return 500 when categories query fails', async () => {
      shouldFailCategories = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Categories query error');
    });

    it('should return 500 when methods query fails', async () => {
      shouldFailMethods = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Methods query error');
    });

    it('should return 500 when holidays query fails', async () => {
      shouldFailHolidays = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Holidays query error');
    });

    it('should return 500 when special diets query fails', async () => {
      shouldFailDiets = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Special Diets query error');
    });

    it('should return 500 when ingredients query fails', async () => {
      shouldFailIngredients = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Ingredients query error');
    });

    it('should return 500 when recipe ingredients counts query fails', async () => {
      shouldFailCounts = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Counts query error');
    });

    it('should return 500 when a generic code exception occurs', async () => {
      shouldThrowGeneric = true;
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Generic database connection crash');
    });

    it('should handle non-Error string exceptions', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw 'String exception';
      });
      const res = await request(app).get('/api/recipe-index');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('String exception');
    });
  });
});
