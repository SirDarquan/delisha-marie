import type { SupabaseClient } from '@supabase/supabase-js';
import { Request, Response, Router } from 'express';

const recipeIndexRouter = Router();

let supabaseClient: SupabaseClient | null = null;
async function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env['SUPABASE_URL'] || '';
    const supabaseKey = process.env['SUPABASE_KEY'] || '';
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key are required. Check environment variables.');
    }
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

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
  const { data, error } = await supabase
    .from('recipe_categories')
    .select('categories (name, url), recipes!inner (status)')
    .eq('recipes.status', 'published')
    .ilike('categories.url', `/${type}%`);

  if (error) throw error;

  const categoriesMap = new Map<string, { name: string; url: string }>();
  data?.forEach((row: unknown) => {
    const rowTyped = row as {
      categories: { name: string | null; url: string | null } | null;
    } | null;
    const cat = rowTyped?.categories;
    if (cat && cat.name && cat.url) {
      categoriesMap.set(cat.url, { name: cat.name, url: cat.url });
    }
  });

  return Array.from(categoriesMap.values());
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
    .from('recipe_holidays')
    .select('holidays (name, slug), recipes!inner (status)')
    .eq('recipes.status', 'published');

  if (error) throw error;

  const holidaysMap = new Map<string, { name: string; url: string }>();
  data?.forEach((row: unknown) => {
    const rowTyped = row as { holidays: { name: string; slug: string } | null } | null;
    const h = rowTyped?.holidays;
    if (h && h.name && h.slug) {
      holidaysMap.set(h.slug, {
        name: h.name,
        url: `/holidays/${h.slug}`,
      });
    }
  });

  return Array.from(holidaysMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function getSpecialDiets(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('recipe_special_diets')
    .select('special_diets (name, slug), recipes!inner (status)')
    .eq('recipes.status', 'published');

  if (error) throw error;

  const dietsMap = new Map<string, { name: string; url: string }>();
  data?.forEach((row: unknown) => {
    const rowTyped = row as { special_diets: { name: string; slug: string } | null } | null;
    const d = rowTyped?.special_diets;
    if (d && d.name && d.slug) {
      dietsMap.set(d.slug, {
        name: d.name,
        url: `/special-diets/${d.slug}`,
      });
    }
  });

  return Array.from(dietsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function getCookingMethodsAndList(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('recipe_methods')
    .select('methods (name, slug), recipes!inner (status)')
    .eq('recipes.status', 'published');

  if (error) throw error;

  const methodsMap = new Map<string, { name: string; slug: string }>();
  data?.forEach((row: unknown) => {
    const rowTyped = row as { methods: { name: string; slug: string } | null } | null;
    const m = rowTyped?.methods;
    if (m && m.name && m.slug) {
      methodsMap.set(m.slug, {
        name: m.name,
        slug: m.slug,
      });
    }
  });

  const methodsListSorted = Array.from(methodsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

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
    .eq('status', 'published');

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

recipeIndexRouter.get('/recipe-index', async (req: Request, res: Response) => {
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
});

export default recipeIndexRouter;
