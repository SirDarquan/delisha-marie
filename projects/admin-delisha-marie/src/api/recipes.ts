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
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data);
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
      filterRecipeColumns(
        Object.fromEntries(Object.entries(req.body).map(([k, v]) => [snakeCase(k), v])),
      ),
    );

    const { data: recipe, error } = await client.from('recipes').insert(dbBody).select().single();
    if (error) throw error;

    const camelRecipe = Object.fromEntries(
      Object.entries(recipe).map(([k, v]) => [camelCase(k), v]),
    ) as Record<string, unknown> & { id: string | number };

    await saveRecipeCategory(client, camelRecipe['id'], categoryData);
    await saveRecipeMethod(client, camelRecipe['id'], methodName);
    await saveRecipeHolidays(client, camelRecipe['id'], holidaysData);
    await saveRecipeSpecialDiets(client, camelRecipe['id'], specialDietsData);

    return res.json({ ...camelRecipe, category: categoryData });
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
      filterRecipeColumns(
        Object.fromEntries(Object.entries(updateBody).map(([k, v]) => [snakeCase(k), v])),
      ),
    );

    const { data: updateData, error: updateError } = await client
      .from('recipes')
      .update(dbBody)
      .eq('id', req.params['id'])
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    let recipe = null;
    if (updateData) {
      recipe = updateData;
    } else {
      const insertBody = { ...dbBody, id: req.params['id'] };
      const { data: insertData, error: insertError } = await client
        .from('recipes')
        .insert(insertBody)
        .select()
        .single();
      if (insertError) throw insertError;
      recipe = insertData;
    }

    const camelRecipe = Object.fromEntries(
      Object.entries(recipe).map(([k, v]) => [camelCase(k), v]),
    ) as Record<string, unknown> & { id: string | number };

    await saveRecipeCategory(client, camelRecipe['id'], categoryData);
    await saveRecipeMethod(client, camelRecipe['id'], methodName);
    await saveRecipeHolidays(client, camelRecipe['id'], holidaysData);
    await saveRecipeSpecialDiets(client, camelRecipe['id'], specialDietsData);

    return res.json({ ...camelRecipe, category: categoryData });
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

async function getOrCreateCategory(
  client: SupabaseClient,
  name: string,
  url: string,
): Promise<string> {
  const { data, error } = await client.from('categories').select('id').eq('url', url).maybeSingle();
  if (error) throw error;
  if (data) return data.id;

  const { data: newCat, error: insertError } = await client
    .from('categories')
    .insert({ name, url })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return newCat.id;
}

async function getOrCreateMethod(client: SupabaseClient, name: string): Promise<string> {
  const slug = slugify(name);
  const { data, error } = await client.from('methods').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (data) return data.id;

  const { data: newMethod, error: insertError } = await client
    .from('methods')
    .insert({ name, slug })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return newMethod.id;
}

async function getOrCreateHoliday(client: SupabaseClient, name: string): Promise<string> {
  const slug = slugify(name);
  const { data, error } = await client.from('holidays').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (data) return data.id;

  const { data: newHoliday, error: insertError } = await client
    .from('holidays')
    .insert({ name, slug })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return newHoliday.id;
}

async function getOrCreateSpecialDiet(client: SupabaseClient, name: string): Promise<string> {
  const slug = slugify(name);
  const { data, error } = await client
    .from('special_diets')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id;

  const { data: newDiet, error: insertError } = await client
    .from('special_diets')
    .insert({ name, slug })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return newDiet.id;
}

async function saveRecipeCategory(
  client: SupabaseClient,
  recipeId: string | number,
  categoryData: { trails?: { name?: string; url?: string }[][] } | null | undefined,
): Promise<void> {
  if (!categoryData?.trails || !Array.isArray(categoryData.trails)) {
    return;
  }

  const { error: deleteError } = await client
    .from('recipe_categories')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteError) throw deleteError;

  for (const trail of categoryData.trails) {
    if (!Array.isArray(trail)) continue;
    for (let i = 2; i < trail.length; i++) {
      const part = trail[i];
      if (!part?.name || !part.url || part.url.startsWith('/recipe/')) {
        continue;
      }

      const catId = await getOrCreateCategory(client, part.name, part.url);
      const { error: relError } = await client
        .from('recipe_categories')
        .upsert(
          { recipe_id: recipeId, category_id: catId },
          { onConflict: 'recipe_id,category_id' },
        );
      if (relError) throw relError;
    }
  }
}

async function saveRecipeMethod(
  client: SupabaseClient,
  recipeId: string | number,
  methodName: unknown,
): Promise<void> {
  const { error: deleteError } = await client
    .from('recipe_methods')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteError) throw deleteError;

  if (typeof methodName !== 'string' || methodName.trim() === '') {
    return;
  }

  const methodId = await getOrCreateMethod(client, methodName.trim());
  const { error: relError } = await client
    .from('recipe_methods')
    .upsert({ recipe_id: recipeId, method_id: methodId }, { onConflict: 'recipe_id,method_id' });
  if (relError) throw relError;
}

async function saveRecipeHolidays(
  client: SupabaseClient,
  recipeId: string | number,
  holidays: unknown,
): Promise<void> {
  const { error: deleteError } = await client
    .from('recipe_holidays')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteError) throw deleteError;

  if (!Array.isArray(holidays)) {
    return;
  }

  for (const holName of holidays) {
    if (typeof holName !== 'string' || holName.trim() === '') {
      continue;
    }

    const holidayId = await getOrCreateHoliday(client, holName.trim());
    const { error: relError } = await client
      .from('recipe_holidays')
      .upsert(
        { recipe_id: recipeId, holiday_id: holidayId },
        { onConflict: 'recipe_id,holiday_id' },
      );
    if (relError) throw relError;
  }
}

async function saveRecipeSpecialDiets(
  client: SupabaseClient,
  recipeId: string | number,
  specialDiets: unknown,
): Promise<void> {
  const { error: deleteError } = await client
    .from('recipe_special_diets')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteError) throw deleteError;

  if (!Array.isArray(specialDiets)) {
    return;
  }

  for (const dietName of specialDiets) {
    if (typeof dietName !== 'string' || dietName.trim() === '') {
      continue;
    }

    const dietId = await getOrCreateSpecialDiet(client, dietName.trim());
    const { error: relError } = await client
      .from('recipe_special_diets')
      .upsert({ recipe_id: recipeId, diet_id: dietId }, { onConflict: 'recipe_id,diet_id' });
    if (relError) throw relError;
  }
}

export default recipesRouter;
