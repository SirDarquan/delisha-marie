import type { SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

interface CategoryItem {
  name: string;
  url: string;
  children?: { name: string; url: string }[];
}

interface IngredientListItem {
  id: string;
  name: string;
  url: string;
  count: number;
  children?: IngredientListItem[];
}

function buildCategoryHierarchyFromParts(
  items: { name: string | null; url: string | null }[],
  mainSegment: string,
): CategoryItem[] {
  const parentNames = new Map<string, string>();
  const parentToChildren = new Map<string, Map<string, string>>();

  items.forEach((item) => {
    if (item.url && item.name) {
      const parts = item.url.split('/');
      if (parts[1] === mainSegment) {
        if (parts.length === 3) {
          const parentSlug = parts[2];
          parentNames.set(parentSlug, item.name);
        } else if (parts.length === 4) {
          const parentSlug = parts[2];
          const childSlug = parts[3];

          if (!parentToChildren.has(parentSlug)) {
            parentToChildren.set(parentSlug, new Map<string, string>());
          }
          parentToChildren.get(parentSlug)!.set(childSlug, item.name);
        }
      }
    }
  });

  return Array.from(parentNames.entries())
    .map(([parentSlug, name]) => {
      const item: CategoryItem = {
        name,
        url: `/${mainSegment}/${parentSlug}`,
      };
      const childrenMap = parentToChildren.get(parentSlug);
      if (childrenMap && childrenMap.size > 0) {
        item.children = Array.from(childrenMap.entries())
          .map(([childSlug, childName]) => ({
            name: childName,
            url: `/${mainSegment}/${parentSlug}/${childSlug}`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return item;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getCategoriesFromDB(
  supabase: SupabaseClient,
  type: 'recipes' | 'the-best' = 'recipes',
) {
  let query = supabase
    .from('categories')
    .select('name, url, recipe_categories!inner (recipes!inner (status, the_best, created_at))')
    .eq('recipe_categories.recipes.status', 'published')
    .lte('recipe_categories.recipes.created_at', new Date().toISOString())
    .ilike('url', `/${type}%`);

  if (type === 'the-best') {
    query = query.eq('recipe_categories.recipes.the_best', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || [])
    .filter((cat: { name?: string | null; url?: string | null }) => cat?.name && cat.url)
    .map((cat: { name?: string | null; url?: string | null }) => ({
      name: cat.name as string,
      url: cat.url as string,
    }));
}

async function getFeaturedCategories(supabase: SupabaseClient) {
  const categories = await getCategoriesFromDB(supabase);
  const categoriesList = buildCategoryHierarchyFromParts(categories, 'recipes');

  return categoriesList
    .map((cat) => {
      const parentSlug = cat.url.split('/').at(-1) || '';
      return {
        name: cat.name,
        url: cat.url,
        image: `/images/categories/${parentSlug}.png`,
      };
    })
    .slice(0, 8);
}

async function getCategoriesList(supabase: SupabaseClient): Promise<CategoryItem[]> {
  const categories = await getCategoriesFromDB(supabase);
  return buildCategoryHierarchyFromParts(categories, 'recipes');
}

async function getHolidays(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('holidays')
    .select('name, slug, recipe_holidays!inner (recipes!inner (status, created_at))')
    .eq('recipe_holidays.recipes.status', 'published')
    .lte('recipe_holidays.recipes.created_at', new Date().toISOString());

  if (error) throw error;

  return (data || [])
    .filter((h: { name?: string | null; slug?: string | null }) => h?.name && h.slug)
    .map((h: { name?: string | null; slug?: string | null }) => ({
      name: h.name as string,
      url: `/holidays/${h.slug as string}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getSpecialDiets(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('special_diets')
    .select('name, slug, recipe_special_diets!inner (recipes!inner (status, created_at))')
    .eq('recipe_special_diets.recipes.status', 'published')
    .lte('recipe_special_diets.recipes.created_at', new Date().toISOString());

  if (error) throw error;

  return (data || [])
    .filter((d: { name?: string | null; slug?: string | null }) => d?.name && d.slug)
    .map((d: { name?: string | null; slug?: string | null }) => ({
      name: d.name as string,
      url: `/special-diets/${d.slug as string}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getCookingMethodsAndList(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('methods')
    .select('name, slug, recipe_methods!inner (recipes!inner (status, created_at))')
    .eq('recipe_methods.recipes.status', 'published')
    .lte('recipe_methods.recipes.created_at', new Date().toISOString());

  if (error) throw error;

  const methodsListSorted = (data || [])
    .filter((m: { name?: string | null; slug?: string | null }) => m?.name && m.slug)
    .map((m: { name?: string | null; slug?: string | null }) => ({
      name: m.name as string,
      slug: m.slug as string,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cookingMethods = methodsListSorted
    .map((m) => ({
      name: m.name,
      url: `/methods/${m.slug}`,
      image: `/images/methods/${m.slug}.png`,
    }))
    .slice(0, 6);

  const methodsList = methodsListSorted.map((m) => ({
    name: m.name,
    url: `/methods/${m.slug}`,
  }));

  return { cookingMethods, methodsList };
}

async function getIngredients(supabase: SupabaseClient) {
  const { data: dbIngredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('id, name, slug');

  if (ingredientsError) throw ingredientsError;

  const { data: relationCounts, error: countsError } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_id');

  if (countsError) throw countsError;

  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id')
    .eq('status', 'published')
    .lte('created_at', new Date().toISOString());

  if (recipesError) throw recipesError;

  const publishedIds = new Set((recipes as { id: string }[] | null)?.map((r) => r.id));
  const countMap = new Map<string, number>();
  (relationCounts as { recipe_id: string; ingredient_id: string }[] | null)?.forEach((ri) => {
    if (ri.ingredient_id && publishedIds.has(ri.recipe_id)) {
      countMap.set(ri.ingredient_id, (countMap.get(ri.ingredient_id) || 0) + 1);
    }
  });

  const ingredientsWithCounts: IngredientListItem[] =
    (dbIngredients as { id: string; name: string; slug: string }[] | null)
      ?.map((i) => ({
        id: i.id,
        name: i.name,
        url: `/tag/${i.slug}`,
        count: countMap.get(i.id) || 0,
      }))
      .filter((i) => i.count > 0) || [];

  const matchedAsChild = new Set<string>();
  const sortedIngs = [...ingredientsWithCounts].sort((a, b) => a.name.length - b.name.length);

  for (const ing of sortedIngs) {
    if (matchedAsChild.has(ing.id)) continue;

    const children = sortedIngs.filter(
      (other) =>
        other.id !== ing.id && other.name.toLowerCase().startsWith(ing.name.toLowerCase() + ' '),
    );

    if (children.length > 0) {
      ing.children = children;
      children.forEach((c) => matchedAsChild.add(c.id));
    }
  }

  return sortedIngs
    .filter((ing) => !matchedAsChild.has(ing.id))
    .map((ing) => {
      const item: {
        name: string;
        url: string;
        count: number;
        children?: { name: string; url: string; count: number }[];
      } = {
        name: ing.name,
        url: ing.url,
        count: ing.count,
      };
      if (ing.children) {
        item.children = ing.children
          .map((c) => ({
            name: c.name,
            url: c.url,
            count: c.count,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return item;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getBestRecipes(supabase: SupabaseClient): Promise<CategoryItem[]> {
  const categories = await getCategoriesFromDB(supabase, 'the-best');
  return buildCategoryHierarchyFromParts(categories, 'the-best-recipes');
}

export default async function recipeIndexHandler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/^\/api/, '');

  if (pathname !== '/recipe-index') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const supabase = await getSupabaseClient();

    const [
      featuredCategories,
      categoriesList,
      holidays,
      specialDiets,
      ingredients,
      methodsResult,
      bestRecipes,
    ] = await Promise.all([
      getFeaturedCategories(supabase),
      getCategoriesList(supabase),
      getHolidays(supabase),
      getSpecialDiets(supabase),
      getIngredients(supabase),
      getCookingMethodsAndList(supabase),
      getBestRecipes(supabase),
    ]);

    const { cookingMethods, methodsList } = methodsResult;

    return res.json({
      featuredCategories,
      cookingMethods,
      categoriesList,
      methodsList,
      holidays,
      specialDiets,
      bestRecipes,
      ingredients,
    });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
