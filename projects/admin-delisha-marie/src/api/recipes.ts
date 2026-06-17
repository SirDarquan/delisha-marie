import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';

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

recipesRouter.post('/recipes', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const categoryData = req.body.category;
    const methodName = req.body.method;
    const holidaysData = req.body.holidays;
    const specialDietsData = req.body.specialDiets;

    const dbBody = normalizeDbBody(
      filterRecipeColumns(camelToSnake(req.body) as Record<string, unknown>),
    );

    const { data: recipe, error } = await client
      .from('recipes')
      .insert(dbBody)
      .select()
      .single();
    if (error) throw error;

    const camelRecipe = snakeToCamel(recipe);

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
      filterRecipeColumns(camelToSnake(updateBody) as Record<string, unknown>),
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

    const camelRecipe = snakeToCamel(recipe);

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
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function camelToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snake] = obj[key];
  }
  return result;
}

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camel = key.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', ''),
    );
    result[camel] = obj[key];
  }
  return result;
}

function filterRecipeColumns(obj: Record<string, any>): Record<string, any> {
  const allowed = [
    'id', 'title', 'slug', 'difficulty', 'prep_time', 'cook_time',
    'total_time', 'yield', 'image', 'image_width', 'image_height',
    'image_type', 'description', 'content', 'ingredients', 'instructions',
    'author', 'status', 'preview_token', 'the_best', 'breadcrumbs',
    'cuisine', 'course', 'nutrition', 'keywords', 'equipment', 'notes'
  ];
  const result: Record<string, any> = {};
  for (const key of allowed) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

function normalizeDbBody(obj: Record<string, any>): Record<string, any> {
  const result = { ...obj };
  const nullable = [
    'prep_time', 'cook_time', 'total_time', 'yield', 'image',
    'image_width', 'image_height', 'image_type', 'description',
    'content', 'preview_token', 'cuisine', 'course'
  ];
  for (const key of nullable) {
    if (key in result && (result[key] === '' || result[key] === undefined)) {
      result[key] = null;
    }
  }
  return result;
}

async function saveRecipeCategory(
  client: any,
  recipeId: string | number,
  categoryData: any,
): Promise<void> {
  if (!categoryData?.trails || !Array.isArray(categoryData.trails)) {
    return;
  }

  const { error: deleteRelError } = await client
    .from('recipe_categories')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteRelError) throw deleteRelError;

  for (const trail of categoryData.trails) {
    if (!Array.isArray(trail)) continue;
    for (let i = 2; i < trail.length; i++) {
      const part = trail[i];
      if (!part?.name || !part.url || part.url.startsWith('/recipe/')) {
        continue;
      }

      let catId: string;
      const { data: existingCat, error: findError } = await client
        .from('categories')
        .select('id')
        .eq('url', part.url)
        .maybeSingle();
      if (findError) throw findError;

      if (existingCat) {
        catId = existingCat.id;
      } else {
        const { data: newCat, error: insertError } = await client
          .from('categories')
          .insert({ name: part.name, url: part.url })
          .select('id')
          .single();
        if (insertError) throw insertError;
        catId = newCat.id;
      }

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
  client: any,
  recipeId: string | number,
  methodName: any,
): Promise<void> {
  const { error: deleteMethodRelError } = await client
    .from('recipe_methods')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteMethodRelError) throw deleteMethodRelError;

  if (typeof methodName !== 'string' || methodName.trim() === '') {
    return;
  }

  const nameTrimmed = methodName.trim();
  const methodSlug = slugify(nameTrimmed);

  let methodId: string;
  const { data: existingMethod, error: findError } = await client
    .from('methods')
    .select('id')
    .eq('slug', methodSlug)
    .maybeSingle();
  if (findError) throw findError;

  if (existingMethod) {
    methodId = existingMethod.id;
  } else {
    const { data: newMethod, error: insertError } = await client
      .from('methods')
      .insert({ name: nameTrimmed, slug: methodSlug })
      .select('id')
      .single();
    if (insertError) throw insertError;
    methodId = newMethod.id;
  }

  const { error: relError } = await client
    .from('recipe_methods')
    .upsert(
      { recipe_id: recipeId, method_id: methodId },
      { onConflict: 'recipe_id,method_id' },
    );
  if (relError) throw relError;
}

async function saveRecipeHolidays(
  client: any,
  recipeId: string | number,
  holidays: any,
): Promise<void> {
  const { error: deleteHolidayRelError } = await client
    .from('recipe_holidays')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteHolidayRelError) throw deleteHolidayRelError;

  if (!Array.isArray(holidays)) {
    return;
  }

  for (const holName of holidays) {
    if (typeof holName !== 'string' || holName.trim() === '') {
      continue;
    }
    const holidayName = holName.trim();
    const holidaySlug = slugify(holidayName);

    let holidayId: string;
    const { data: existingHol, error: findError } = await client
      .from('holidays')
      .select('id')
      .eq('slug', holidaySlug)
      .maybeSingle();
    if (findError) throw findError;

    if (existingHol) {
      holidayId = existingHol.id;
    } else {
      const { data: newHol, error: insertError } = await client
        .from('holidays')
        .insert({ name: holidayName, slug: holidaySlug })
        .select('id')
        .single();
      if (insertError) throw insertError;
      holidayId = newHol.id;
    }

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
  client: any,
  recipeId: string | number,
  specialDiets: any,
): Promise<void> {
  const { error: deleteDietRelError } = await client
    .from('recipe_special_diets')
    .delete()
    .eq('recipe_id', recipeId);
  if (deleteDietRelError) throw deleteDietRelError;

  if (!Array.isArray(specialDiets)) {
    return;
  }

  for (const dietName of specialDiets) {
    if (typeof dietName !== 'string' || dietName.trim() === '') {
      continue;
    }
    const nameTrimmed = dietName.trim();
    const dietSlug = slugify(nameTrimmed);

    let dietId: string;
    const { data: existingDiet, error: findError } = await client
      .from('special_diets')
      .select('id')
      .eq('slug', dietSlug)
      .maybeSingle();
    if (findError) throw findError;

    if (existingDiet) {
      dietId = existingDiet.id;
    } else {
      const { data: newDiet, error: insertError } = await client
        .from('special_diets')
        .insert({ name: nameTrimmed, slug: dietSlug })
        .select('id')
        .single();
      if (insertError) throw insertError;
      dietId = newDiet.id;
    }

    const { error: relError } = await client
      .from('recipe_special_diets')
      .upsert(
        { recipe_id: recipeId, diet_id: dietId },
        { onConflict: 'recipe_id,diet_id' },
      );
    if (relError) throw relError;
  }
}

export default recipesRouter;
