import { camelCase, snakeCase } from 'change-case';
import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';
import { SupabaseClient } from '@supabase/supabase-js';

const recipesRouter = Router();

recipesRouter.use(authMiddleware);

recipesRouter.get('/recipes', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
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
      .order('created_at', { ascending: false });
    if (error) throw error;

    const formatted = (data || []).map((rawRecipe: unknown) => {
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

    return res.json(formatted);
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
    if (part?.name && part.url && !part.url.startsWith('/recipe/')) {
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
