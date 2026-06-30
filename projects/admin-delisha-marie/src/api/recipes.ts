import { SupabaseClient } from '@supabase/supabase-js';
import { camelCase, snakeCase } from 'change-case';
import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';

const recipesRouter = Router();

recipesRouter.use(authMiddleware);

recipesRouter.get('/recipes', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);

    const offsetStr = req.query['offset'] as string | undefined;
    const limitStr = req.query['limit'] as string | undefined;

    const statusOrder: Record<string, number> = {
      draft: 1,
      scheduled: 2,
      published: 3,
    };

    if (offsetStr !== undefined || limitStr !== undefined) {
      const offset = parseInt(offsetStr || '0', 10);
      const limit = parseInt(limitStr || '100', 10);
      const search = req.query['search'] as string | undefined;

      // 1. Fetch lightweight skeleton
      let skeletonQuery = client
        .from('recipes')
        .select('id, status, updated_at');

      if (search) {
        skeletonQuery = skeletonQuery.ilike('title', `%${search}%`);
      }

      const { data: skeletonData, error: skeletonError } = await skeletonQuery;
        
      if (skeletonError) throw skeletonError;

      // 2. Sort skeleton in memory
      const sortedSkeleton = (skeletonData || []).sort((a: any, b: any) => {
        const aStatus = a.status ? String(a.status).toLowerCase() : '';
        const bStatus = b.status ? String(b.status).toLowerCase() : '';
        const aOrder = statusOrder[aStatus] || 99;
        const bOrder = statusOrder[bStatus] || 99;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        const aTime = a.updated_at ? new Date(String(a.updated_at)).getTime() : 0;
        const bTime = b.updated_at ? new Date(String(b.updated_at)).getTime() : 0;
        return bTime - aTime;
      });

      // 3. Slice for current page
      const pageIds = sortedSkeleton.slice(offset, offset + limit).map((r) => r.id);

      if (pageIds.length === 0) {
        return res.json([]);
      }

      // 4. Fetch full data for just those IDs
      const { data: pageData, error: pageError } = await client
        .from('recipes')
        .select(`
          *,
          recipe_holidays (
            holidays (name)
          ),
          recipe_special_diets (
            special_diets (name)
          )
        `)
        .in('id', pageIds);

      if (pageError) throw pageError;

      // 5. Format and re-sort
      const formatted = (pageData || []).map((rawRecipe: unknown) => {
        const recipe = rawRecipe as Record<string, unknown> & {
          recipe_holidays?: { holidays: { name: string } | null }[];
          recipe_special_diets?: { special_diets: { name: string } | null }[];
        };
        const holidays = recipe.recipe_holidays?.map((h) => h.holidays?.name).filter(Boolean) || [];
        const specialDiets =
          recipe.recipe_special_diets?.map((d) => d.special_diets?.name).filter(Boolean) || [];

        const cleanRecipe = { ...recipe };
        delete cleanRecipe.recipe_holidays;
        delete cleanRecipe.recipe_special_diets;

        const camelRecipe = camelCaseKeys(cleanRecipe);

        return {
          ...camelRecipe,
          holidays,
          specialDiets,
        };
      });

      formatted.sort((a: any, b: any) => {
        return pageIds.indexOf(a.id) - pageIds.indexOf(b.id);
      });

      return res.json(formatted);
    }

    // Fallback: Fetch everything for unpaginated requests
    const allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from('recipes')
        .select(
          `
          *,
          recipe_holidays (
            holidays (name)
          ),
          recipe_special_diets (
            special_diets (name)
          )
        `,
        )
        .order('updated_at', { ascending: false })
        .range(from, from + step - 1);
      if (error) throw error;
      
      if (data && data.length > 0) {
        allData.push(...data);
      }
      if (!data || data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    const formatted = allData.map((rawRecipe: unknown) => {
      const recipe = rawRecipe as Record<string, unknown> & {
        recipe_holidays?: { holidays: { name: string } | null }[];
        recipe_special_diets?: { special_diets: { name: string } | null }[];
      };
      const holidays = recipe.recipe_holidays?.map((h) => h.holidays?.name).filter(Boolean) || [];
      const specialDiets =
        recipe.recipe_special_diets?.map((d) => d.special_diets?.name).filter(Boolean) || [];

      const cleanRecipe = { ...recipe };
      delete cleanRecipe.recipe_holidays;
      delete cleanRecipe.recipe_special_diets;

      const camelRecipe = camelCaseKeys(cleanRecipe);

      return {
        ...camelRecipe,
        holidays,
        specialDiets,
      };
    });

    formatted.sort((a: any, b: any) => {
      const aStatus = a.status ? String(a.status).toLowerCase() : '';
      const bStatus = b.status ? String(b.status).toLowerCase() : '';
      const aOrder = statusOrder[aStatus] || 99;
      const bOrder = statusOrder[bStatus] || 99;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      const aTime = a.updatedAt ? new Date(String(a.updatedAt)).getTime() : 0;
      const bTime = b.updatedAt ? new Date(String(b.updatedAt)).getTime() : 0;
      return bTime - aTime;
    });

    return res.json(formatted);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

interface RecipeCategoryRelation {
  categories: { name: string } | null;
}

interface RecentRecipeRow {
  id: string | number;
  title: string;
  prep_time?: string | null;
  author?: string | null;
  created_at?: string | null;
  recipe_categories?: RecipeCategoryRelation[];
}

recipesRouter.get('/home', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);

    // 1. Get total recipes count
    const { count, error: countError } = await client
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // 2. Get recent recipes (last 3)
    const { data: recentData, error: recentError } = await client
      .from('recipes')
      .select(
        `
        id,
        title,
        prep_time,
        author,
        created_at,
        recipe_categories (
          categories (name)
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentError) throw recentError;

    const recentRecipes = ((recentData as unknown as RecentRecipeRow[]) || []).map((recipe) => {
      let category = 'Uncategorized';
      if (recipe.recipe_categories && recipe.recipe_categories.length > 0) {
        const cats = recipe.recipe_categories
          .map((rc) => rc.categories?.name)
          .filter((name): name is string => !!name);
        if (cats.length > 0) {
          category = cats[0];
        }
      }

      return {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author || 'Delisha Marie',
        prepTime: recipe.prep_time || '',
        category,
        createdAt: recipe.created_at,
      };
    });

    return res.json({
      totalRecipes: count || 0,
      recentRecipes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

recipesRouter.get('/holidays', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const { data, error } = await client.from('holidays').select('id, name').order('name');
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

recipesRouter.get('/special-diets', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const { data, error } = await client.from('special_diets').select('id, name').order('name');
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

recipesRouter.get('/methods', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const { data, error } = await client.from('methods').select('id, name, slug').order('name');
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

recipesRouter.post('/recipes', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const categoryData = req.body.category;
    const methodName = req.body.method;
    const holidaysData = req.body.holidays;
    const specialDietsData = req.body.specialDiets;

    const dbBody = normalizeDbBody(
      filterRecipeColumns(snakeCaseKeys(req.body as Record<string, unknown>)),
    );

    const { data: recipe, error } = await client.from('recipes').insert(dbBody).select().single();
    if (error) throw error;

    const camelRecipe = camelCaseKeys(recipe) as Record<string, unknown> & { id: string | number };

    await saveAllRecipeRelations(
      client,
      camelRecipe['id'],
      categoryData,
      methodName,
      holidaysData,
      specialDietsData,
    );

    return res.json({
      ...camelRecipe,
      category: categoryData,
      holidays: holidaysData || [],
      specialDiets: specialDietsData || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.put('/recipes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const categoryData = req.body.category;
    const methodName = req.body.method;
    const holidaysData = req.body.holidays;
    const specialDietsData = req.body.specialDiets;

    const updateBody = { ...req.body };
    delete updateBody.id;

    const dbBody = normalizeDbBody(
      filterRecipeColumns(snakeCaseKeys(updateBody as Record<string, unknown>)),
    );

    let recipe = null;
    const { data: updateData, error: updateError } = await client
      .from('recipes')
      .update(dbBody)
      .eq('id', req.params['id'])
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    recipe = updateData;
    if (!updateData) {
      const data = await client
        .from('recipes')
        .select('*')
        .eq('id', req.params['id'])
        .maybeSingle();
      recipe = data.data;
    }
    if (!recipe) {
      return res.status(400).json({ error: 'Recipe not found' });
    }

    const camelRecipe = camelCaseKeys(recipe) as Record<string, unknown> & { id: string | number };

    await saveAllRecipeRelations(
      client,
      camelRecipe['id'],
      categoryData,
      methodName,
      holidaysData,
      specialDietsData,
    );

    return res.json({
      ...camelRecipe,
      category: categoryData,
      holidays: holidaysData || [],
      specialDiets: specialDietsData || [],
    });
  } catch (err: unknown) {
    console.log('caught error in POST /recipes:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.delete('/recipes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const { error } = await client.from('recipes').delete().eq('id', req.params['id']);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

// --- Helper Functions ---

function camelCaseKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelCase(k), v]));
}

function snakeCaseKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [snakeCase(k), v]));
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function filterRecipeColumns(obj: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    'title',
    'slug',
    'prep_time',
    'cook_time',
    'total_time',
    'yield',
    'image',
    'image_width',
    'image_height',
    'image_type',
    'description',
    'content',
    'ingredients',
    'instructions',
    'author',
    'status',
    'preview_token',
    'the_best',
    'breadcrumbs',
    'cuisine',
    'course',
    'nutrition',
    'keywords',
    'equipment',
    'notes',
    'video',
  ];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

function normalizeDbBody(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj };
  const nullable = [
    'prep_time',
    'cook_time',
    'total_time',
    'yield',
    'image',
    'image_width',
    'image_height',
    'image_type',
    'description',
    'content',
    'preview_token',
    'cuisine',
    'course',
    'video',
  ];
  for (const key of nullable) {
    if (key in result && (result[key] === '' || result[key] === undefined)) {
      result[key] = null;
    }
  }
  if (result['nutrition'] && typeof result['nutrition'] === 'object') {
    result['nutrition'] = Object.fromEntries(
      Object.entries(result['nutrition']).map(([k, v]) => [snakeCase(k), v]),
    );
  }
  return result;
}

async function getOrCreateLookupItem(
  client: SupabaseClient,
  tableName: 'methods' | 'holidays' | 'special_diets' | 'categories',
  name: string,
  urlOverride?: string,
): Promise<string> {
  const isCategory = tableName === 'categories';
  const matchField = isCategory ? 'url' : 'slug';
  const matchValue = isCategory ? urlOverride || '' : slugify(name);

  const { data, error } = await client
    .from(tableName)
    .select('id')
    .eq(matchField, matchValue)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id as string;

  const { data: newItem, error: insertError } = await client
    .from(tableName)
    .insert({ name, [matchField]: matchValue })
    .select('id')
    .single();
  console.log('insert completed for', name, 'error:', insertError?.message);
  if (insertError) throw insertError;
  return newItem.id as string;
}

async function saveRecipeCategoryTrail(
  client: SupabaseClient,
  recipeId: string | number,
  trails: unknown[][],
): Promise<void> {
  for (const trail of trails) {
    if (!Array.isArray(trail)) continue;
    await saveTrailParts(client, recipeId, trail);
  }
}

async function saveTrailParts(
  client: SupabaseClient,
  recipeId: string | number,
  trail: unknown[],
): Promise<void> {
  for (let i = 2; i < trail.length; i++) {
    const part = trail[i] as { name?: string; url?: string } | null;
    if (part?.name && typeof part.url === 'string' && !part.url.startsWith('/recipe/')) {
      const catId = await getOrCreateLookupItem(client, 'categories', part.name, part.url);
      const { error } = await client
        .from('recipe_categories')
        .upsert(
          { recipe_id: recipeId, category_id: catId },
          { onConflict: 'recipe_id,category_id' },
        );
      if (error) throw error;
    }
  }
}

async function saveRecipeListRelations(
  client: SupabaseClient,
  recipeId: string | number,
  items: unknown[],
  joinTable: 'recipe_holidays' | 'recipe_special_diets',
  lookupTable: 'holidays' | 'special_diets',
  fkColumn: 'holiday_id' | 'diet_id',
): Promise<void> {
  for (const name of items) {
    if (typeof name === 'string' && name.trim() !== '') {
      const itemId = await getOrCreateLookupItem(client, lookupTable, name.trim());
      const { error } = await client
        .from(joinTable)
        .upsert(
          { recipe_id: recipeId, [fkColumn]: itemId },
          { onConflict: `recipe_id,${fkColumn}` },
        );
      if (error) throw error;
    }
  }
}

async function saveAllRecipeRelations(
  client: SupabaseClient,
  recipeId: string | number,
  categoryData: { trails?: { name?: string; url?: string }[][] } | null | undefined,
  methodName: unknown,
  holidays: unknown,
  specialDiets: unknown,
): Promise<void> {
  const tables = [
    'recipe_categories',
    'recipe_methods',
    'recipe_holidays',
    'recipe_special_diets',
  ] as const;
  for (const table of tables) {
    const { error } = await client.from(table).delete().eq('recipe_id', recipeId);
    if (error) throw error;
  }

  if (categoryData?.trails && Array.isArray(categoryData.trails)) {
    await saveRecipeCategoryTrail(client, recipeId, categoryData.trails);
  }

  if (typeof methodName === 'string' && methodName.trim() !== '') {
    const methodId = await getOrCreateLookupItem(client, 'methods', methodName.trim());
    const { error } = await client
      .from('recipe_methods')
      .upsert({ recipe_id: recipeId, method_id: methodId }, { onConflict: 'recipe_id,method_id' });
    if (error) throw error;
  }

  if (Array.isArray(holidays)) {
    await saveRecipeListRelations(
      client,
      recipeId,
      holidays,
      'recipe_holidays',
      'holidays',
      'holiday_id',
    );
  }

  if (Array.isArray(specialDiets)) {
    await saveRecipeListRelations(
      client,
      recipeId,
      specialDiets,
      'recipe_special_diets',
      'special_diets',
      'diet_id',
    );
  }
}

export default recipesRouter;
