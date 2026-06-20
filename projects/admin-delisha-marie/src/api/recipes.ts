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
      console.log(recipe);
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
    for (const trail of categoryData.trails) {
      if (!Array.isArray(trail)) continue;
      for (let i = 2; i < trail.length; i++) {
        const part = trail[i];
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
  }

  if (typeof methodName === 'string' && methodName.trim() !== '') {
    const methodId = await getOrCreateLookupItem(client, 'methods', methodName.trim());
    const { error } = await client
      .from('recipe_methods')
      .upsert({ recipe_id: recipeId, method_id: methodId }, { onConflict: 'recipe_id,method_id' });
    if (error) throw error;
  }

  const listRelations = [
    { items: holidays, lookupTable: 'holidays', joinTable: 'recipe_holidays', fk: 'holiday_id' },
    {
      items: specialDiets,
      lookupTable: 'special_diets',
      joinTable: 'recipe_special_diets',
      fk: 'diet_id',
    },
  ] as const;

  for (const rel of listRelations) {
    if (Array.isArray(rel.items)) {
      for (const name of rel.items) {
        if (typeof name === 'string' && name.trim() !== '') {
          const itemId = await getOrCreateLookupItem(client, rel.lookupTable, name.trim());
          const { error } = await client
            .from(rel.joinTable)
            .upsert(
              { recipe_id: recipeId, [rel.fk]: itemId },
              { onConflict: `recipe_id,${rel.fk}` },
            );
          if (error) throw error;
        }
      }
    }
  }
}

export default recipesRouter;
