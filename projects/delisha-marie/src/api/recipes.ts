import { Router, Request, Response } from 'express';
import { camelCase } from 'change-case';
import { getSupabaseClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const recipesRouter = Router();

function camelCaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => camelCaseKeys(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        const val = typeof v === 'object' && v !== null ? camelCaseKeys(v) : v;
        return [camelCase(k), val];
      }),
    );
  }
  return obj;
}

interface CategoryInfo {
  id: string;
  name: string;
  url: string;
}

interface CategoryRelation {
  categories: CategoryInfo | null;
}

interface DbRecipe {
  id: string;
  recipe_holidays?: { holidays?: { name: string } | null }[] | null;
  recipe_special_diets?: { special_diets?: { name: string } | null }[] | null;
  recipe_methods?: { methods?: { name: string } | null }[] | null;
  method?: string;
  recipe_categories?: CategoryRelation[] | null;
  recipe_ingredients?: { ingredient_id: string }[] | null;
  [key: string]: unknown;
}

interface FormattedRecipe {
  id: string;
  slug: string;
  title: string;
  status: string;
  theBest?: boolean;
  comments?: unknown[];
  rating?: number;
  breadcrumbs?: {
    main: number;
    items: { label: string; url?: string }[][];
  };
  navigation?: {
    prev: { title: string; slug: string } | null;
    next: { title: string; slug: string } | null;
  } | null;
  [key: string]: unknown;
}

function getSelectString(method: string, category: string): string {
  if (!category) {
    return `
      *,
      recipe_categories (
        categories (id, name, url)
      ),
      recipe_methods (
        methods (name)
      ),
      recipe_holidays (
        holidays (name)
      ),
      recipe_special_diets (
        special_diets (name)
      )
    `;
  }
  if (method === 'recipes' || method === 'the-best-recipes') {
    return `
      *,
      recipe_categories!inner (
        categories!inner (id, name, url)
      ),
      recipe_methods (
        methods (name)
      ),
      recipe_holidays (
        holidays (name)
      ),
      recipe_special_diets (
        special_diets (name)
      )
    `;
  }
  if (method === 'methods') {
    return `
      *,
      recipe_categories (
        categories (id, name, url)
      ),
      recipe_methods!inner (
        methods!inner (name, slug)
      ),
      recipe_holidays (
        holidays (name)
      ),
      recipe_special_diets (
        special_diets (name)
      )
    `;
  }
  if (method === 'special-diets' || method === 'special-diet') {
    return `
      *,
      recipe_categories (
        categories (id, name, url)
      ),
      recipe_methods (
        methods (name)
      ),
      recipe_holidays (
        holidays (name)
      ),
      recipe_special_diets!inner (
        special_diets!inner (name, slug)
      )
    `;
  }
  if (method === 'holiday' || method === 'holidays') {
    return `
      *,
      recipe_categories (
        categories (id, name, url)
      ),
      recipe_methods (
        methods (name)
      ),
      recipe_holidays!inner (
        holidays!inner (name, slug)
      ),
      recipe_special_diets (
        special_diets (name)
      )
    `;
  }
  if (method === 'tag') {
    return `
      *,
      recipe_categories (
        categories (id, name, url)
      ),
      recipe_methods (
        methods (name)
      ),
      recipe_holidays (
        holidays (name)
      ),
      recipe_special_diets (
        special_diets (name)
      ),
      recipe_ingredients!inner (
        ingredient_id
      )
    `;
  }
  return `
    *,
    recipe_categories (
      categories (id, name, url)
    ),
    recipe_methods (
      methods (name)
    ),
    recipe_holidays (
      holidays (name)
    ),
    recipe_special_diets (
      special_diets (name)
    )
  `;
}

async function getTagMatchedIds(
  supabase: SupabaseClient,
  category: string,
  subcategory: string,
): Promise<string[]> {
  let matchedIds: string[] = [];
  if (subcategory) {
    const { data: ing } = await supabase
      .from('ingredients')
      .select('id')
      .eq('slug', subcategory)
      .maybeSingle();
    if (ing) {
      matchedIds = [ing.id];
    }
  } else {
    const { data: parentIng } = await supabase
      .from('ingredients')
      .select('id, name')
      .eq('slug', category)
      .maybeSingle();

    if (parentIng) {
      matchedIds = [parentIng.id];
      const prefix = parentIng.name.toLowerCase() + ' ';
      const { data: allIngs } = await supabase.from('ingredients').select('id, name');
      allIngs?.forEach((i) => {
        if (i.name.toLowerCase().startsWith(prefix)) {
          matchedIds.push(i.id);
        }
      });
    }
  }
  return matchedIds;
}

function applyRecipeFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  method: string,
  category: string,
  subcategory: string,
  matchedIds: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (method === 'the-best-recipes') {
    query = query.eq('the_best', true);
  }

  if (!category) {
    return query;
  }

  if (method === 'recipes') {
    if (subcategory) {
      const catUrl = `/recipes/${category}/${subcategory}`;
      return query.eq('recipe_categories.categories.url', catUrl);
    }
    return query.or(`url.eq./recipes/${category},url.like./recipes/${category}/%`, {
      foreignTable: 'recipe_categories.categories',
    });
  }

  if (method === 'the-best-recipes') {
    if (subcategory) {
      const catUrl = `/the-best-recipes/${category}/${subcategory}`;
      return query.eq('recipe_categories.categories.url', catUrl);
    }
    return query.or(
      `url.eq./the-best-recipes/${category},url.like./the-best-recipes/${category}/%`,
      { foreignTable: 'recipe_categories.categories' },
    );
  }

  if (method === 'methods') {
    return query.eq('recipe_methods.methods.slug', category);
  }

  if (method === 'special-diets' || method === 'special-diet') {
    return query.eq('recipe_special_diets.special_diets.slug', category);
  }

  if (method === 'holiday' || method === 'holidays') {
    return query.eq('recipe_holidays.holidays.slug', category);
  }

  if (method === 'tag') {
    return query.in('recipe_ingredients.ingredient_id', matchedIds);
  }

  return query;
}

function formatDbRecipes(data: DbRecipe[]): FormattedRecipe[] {
  return data.map((recipeRaw: DbRecipe) => {
    const recipe = recipeRaw as DbRecipe;
    const holidays = recipe.recipe_holidays?.map((h) => h.holidays?.name).filter(Boolean) || [];
    const specialDiets =
      recipe.recipe_special_diets?.map((d) => d.special_diets?.name).filter(Boolean) || [];
    const methodVal = recipe.recipe_methods?.[0]?.methods?.name || recipe.method || '';

    const cleanRecipe = { ...recipe };
    delete cleanRecipe['recipe_categories'];
    delete cleanRecipe['recipe_methods'];
    delete cleanRecipe['recipe_holidays'];
    delete cleanRecipe['recipe_special_diets'];
    if ('recipe_ingredients' in cleanRecipe) {
      delete cleanRecipe['recipe_ingredients'];
    }

    return {
      ...(camelCaseKeys(cleanRecipe) as Record<string, unknown>),
      holidays,
      specialDiets,
      method: methodVal,
    } as unknown as FormattedRecipe;
  });
}

recipesRouter.get('/recipes', async (req: Request, res: Response) => {
  try {
    const supabase = await getSupabaseClient();

    const page = Number.parseInt(req.query['page'] as string, 10) || 1;
    const pageSize = Number.parseInt(req.query['pageSize'] as string, 10) || 12;
    const method = (req.query['method'] as string) || 'recipes';
    const category = (req.query['category'] as string) || '';
    const subcategory = (req.query['subcategory'] as string) || '';

    let matchedIds: string[] = [];
    if (category && method === 'tag') {
      matchedIds = await getTagMatchedIds(supabase, category, subcategory);
    }

    const selectStr = getSelectString(method, category);

    let query = supabase.from('recipes').select(selectStr, { count: 'exact' });
    query = query.eq('status', 'published');
    query = applyRecipeFilters(query, method, category, subcategory, matchedIds);

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    const formatted = formatDbRecipes((data || []) as unknown as DbRecipe[]);

    return res.json({
      items: formatted,
      total: count || 0,
    });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

async function getAdjacentRecipe(
  supabase: SupabaseClient,
  recipeId: string,
  rowType: 'next' | 'prev',
): Promise<{ title: string; slug: string } | null> {
  let query = supabase
    .from('recipes')
    .select('id, title, slug, created_at')
    .eq('status', 'published')
    .limit(1);

  if (rowType === 'next') {
    query = query.gt('id', recipeId);
    query = query.order('id', { ascending: true });
  } else {
    query = query.lt('id', recipeId);
    query = query.order('id', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  const filtered = (data || []).map((m) => m as unknown as { title: string; slug: string });

  const next =
    filtered.length > 0 ? { title: filtered[0].title, slug: '/recipe/' + filtered[0].slug } : null;

  return next;
}

async function getBreadcrumbs(
  supabase: SupabaseClient,
  recipeId: string,
  formatted: FormattedRecipe,
): Promise<{ label: string; url?: string }[][]> {
  const { data: recipeCatsData, error: catsError } = await supabase
    .from('recipe_categories')
    .select('categories (id, name, url)')
    .eq('recipe_id', recipeId);
  if (catsError) throw catsError;

  const prefixUrl = formatted.theBest ? '/the-best-recipes' : '/recipes';
  let filteredCategories = (recipeCatsData || [])
    .map((rc) => (rc as unknown as CategoryRelation).categories)
    .filter((cat): cat is CategoryInfo => !!cat?.url.startsWith(prefixUrl));

  if (filteredCategories.length === 0 && recipeCatsData && recipeCatsData.length > 0) {
    const fallbackCat = recipeCatsData
      .map((rc) => (rc as unknown as CategoryRelation).categories)
      .find((cat): cat is CategoryInfo => cat !== null);
    if (fallbackCat) {
      filteredCategories = [fallbackCat];
    }
  }

  const breadcrumbItems: { label: string; url?: string }[][] = [];
  const mainLabel = formatted.theBest ? 'The Best Recipes' : 'Recipes';
  const mainUrl = formatted.theBest ? '/the-best-recipes' : '/recipes';
  const prefix = [
    { label: 'Home', url: '/' },
    { label: mainLabel, url: mainUrl },
  ];

  const trails = filteredCategories.map((c) => ({ label: c.name, url: c.url }));
  breadcrumbItems.push([
    ...prefix,
    ...trails,
    { label: formatted.title, url: '/recipe/' + formatted.slug },
  ]);

  return breadcrumbItems;
}

recipesRouter.get('/recipes/:slug', async (req: Request, res: Response) => {
  try {
    const supabase = await getSupabaseClient();
    const { slug } = req.params as { slug: string };
    const cleanSlug = slug.replace(/^\/?recipe\//, '').replace(/^\//, '');

    // Get recipe
    const selectStr = getSelectString('recipes', '');
    const { data: recipeDataRaw, error: recipeError } = await supabase
      .from('recipes')
      .select(selectStr)
      .eq('slug', cleanSlug)
      .eq('status', 'published')
      .maybeSingle();

    if (recipeError) throw recipeError;
    if (!recipeDataRaw) {
      return res.json(null);
    }

    const recipeData = recipeDataRaw as unknown as DbRecipe;

    // Format fields (reuse formatDbRecipes helper)
    const [formatted] = formatDbRecipes([recipeData]);

    // Populate comments rating & review structure defaults
    formatted.comments = [];
    formatted.rating = 5;

    // Fetch breadcrumbs and adjacent sibling navigation in parallel
    const [breadcrumbs, prev, next] = await Promise.all([
      getBreadcrumbs(supabase, recipeData.id, formatted),
      getAdjacentRecipe(supabase, recipeData.id, 'prev'),
      getAdjacentRecipe(supabase, recipeData.id, 'next'),
    ]);

    formatted.breadcrumbs = {
      main: 0,
      items: breadcrumbs,
    };
    formatted.navigation = {
      prev,
      next,
    };

    // Simulate configurable latency from .env
    const latency = Number(process.env['RECIPE_DETAIL_LATENCY']) || 0;
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }

    return res.json(formatted);
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

export default recipesRouter;
