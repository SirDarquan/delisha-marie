import { vi, describe, it, expect, beforeEach } from 'vitest';

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
import recipeIndexRouter from './recipe-index';

describe('Recipe Index Router API', () => {
  let app: express.Express;

  // Control variables to trigger simulated query errors
  let shouldFailRecipes = false;
  let shouldFailMethods = false;
  let shouldFailHolidays = false;
  let shouldFailDiets = false;
  let shouldFailIngredients = false;
  let shouldFailCounts = false;
  let shouldThrowGeneric = false;

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
  ];

  const mockMethods = [{ name: 'Air Fryer', slug: 'air-fryer' }];

  const mockHolidays = [{ name: 'Christmas', slug: 'christmas' }];

  const mockDiets = [{ name: 'Gluten Free', slug: 'gluten-free' }];

  const mockIngredients = [
    { id: '1', name: 'Apple', slug: 'apple' },
    { id: '2', name: 'Apple Cider', slug: 'apple-cider' },
    { id: '4', name: 'Apple Juice', slug: 'apple-juice' },
    { id: '3', name: 'Baking Soda', slug: 'baking-soda' },
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
    vi.clearAllMocks();
    shouldFailRecipes = false;
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
            if (table === 'methods' && shouldFailMethods) {
              return Promise.resolve({ data: null, error: new Error('Methods query error') }).then(
                onfulfilled,
              );
            }
            if (table === 'holidays' && shouldFailHolidays) {
              return Promise.resolve({ data: null, error: new Error('Holidays query error') }).then(
                onfulfilled,
              );
            }
            if (table === 'special_diets' && shouldFailDiets) {
              return Promise.resolve({
                data: null,
                error: new Error('Special Diets query error'),
              }).then(onfulfilled);
            }
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
            if (table === 'methods') data = mockMethods;
            else if (table === 'holidays') data = mockHolidays;
            else if (table === 'special_diets') data = mockDiets;
            else if (table === 'ingredients') data = mockIngredients;
            else if (table === 'recipe_ingredients') data = mockRelations;

            return Promise.resolve({ data, error: null }).then(onfulfilled);
          };

          return {
            eq: () => {
              if (table === 'recipes' && shouldFailRecipes) {
                return Promise.resolve({ data: null, error: new Error('Recipes query error') });
              }
              return Promise.resolve({ data: mockRecipes, error: null });
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
  });

  describe('GET /recipe-index success flow', () => {
    it('should successfully return the full categorization mapping with child categories and ingredients nested', async () => {
      const res = await request(app).get('/api/recipe-index');

      expect(res.status).toBe(200);

      // Verify categoriesList nesting
      const categoryList = res.body.categoriesList;
      expect(categoryList).toHaveLength(2);
      expect(categoryList[0].name).toBe('Appetizers');
      expect(categoryList[0].children).toHaveLength(2);
      expect(categoryList[0].children[0].name).toBe('Dips');
      expect(categoryList[0].children[0].url).toBe('/recipes/appetizers/dips');
      expect(categoryList[0].children[1].name).toBe('Wings');
      expect(categoryList[0].children[1].url).toBe('/recipes/appetizers/wings');

      expect(categoryList[1].name).toBe('Main Dishes');
      expect(categoryList[1].children).toBeUndefined(); // Main Dishes has no subcategory level 4 breadcrumbs in mockup

      // Verify cooking methods
      expect(res.body.cookingMethods).toHaveLength(1);
      expect(res.body.cookingMethods[0].name).toBe('Air Fryer');

      // Verify holidays
      expect(res.body.holidays).toHaveLength(1);
      expect(res.body.holidays[0].name).toBe('Christmas');

      // Verify special diets
      expect(res.body.specialDiets).toHaveLength(1);
      expect(res.body.specialDiets[0].name).toBe('Gluten Free');

      // Verify best recipes
      const theBest = res.body.bestRecipes;
      expect(theBest).toHaveLength(2);
      expect(theBest[0].name).toBe('The Best Appetizers');
      expect(theBest[0].url).toBe('/the-best-recipes/the-best-appetizers');
      expect(theBest[0].children).toHaveLength(2);
      expect(theBest[0].children[0].name).toBe('The Best Dips');
      expect(theBest[0].children[0].url).toBe('/the-best-recipes/the-best-appetizers/the-best-dips');
      expect(theBest[1].name).toBe('The Best Main Dishes');
      expect(theBest[1].url).toBe('/the-best-recipes/the-best-main-dishes');


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
              eq: () => Promise.resolve({ data: null, error: null }),
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
