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

interface BreadcrumbItem {
  label: string;
  url?: string;
}

interface Breadcrumb {
  items?: (BreadcrumbItem | null)[] | null;
}

interface RecipeRow {
  id: string;
  breadcrumbs: unknown;
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

function parseRecipeCategories(recipes: RecipeRow[] | null) {
  const parentNames = new Map<string, string>();
  const parentToChildren = new Map<string, Map<string, string>>();

  recipes?.forEach((r) => {
    const breadcrumbs = r.breadcrumbs as Breadcrumb[] | null;
    if (Array.isArray(breadcrumbs)) {
      breadcrumbs.forEach((gp) => {
        if (gp && Array.isArray(gp.items)) {
          gp.items.forEach((item) => {
            if (item?.url?.startsWith('/recipes/')) {
              const parts = item.url.split('/');
              if (parts.length === 3) {
                const parentSlug = parts[2];
                parentNames.set(parentSlug, item.label);
              } else if (parts.length === 4) {
                const parentSlug = parts[2];
                const childSlug = parts[3];

                if (!parentToChildren.has(parentSlug)) {
                  parentToChildren.set(parentSlug, new Map<string, string>());
                }
                parentToChildren.get(parentSlug)!.set(childSlug, item.label);
              }
            }
          });
        }
      });
    }
  });

  return { parentNames, parentToChildren };
}

async function getFeaturedCategories(supabase: SupabaseClient) {
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, breadcrumbs')
    .eq('status', 'published');

  if (recipesError) throw recipesError;

  const { parentNames } = parseRecipeCategories(recipes);

  return Array.from(parentNames.entries())
    .map(([parentSlug, name]) => ({
      name,
      url: `/recipes/${parentSlug}`,
      image: `/images/categories/${parentSlug}.png`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);
}

async function getCategoriesList(supabase: SupabaseClient): Promise<CategoryItem[]> {
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, breadcrumbs')
    .eq('status', 'published');

  if (recipesError) throw recipesError;

  const { parentNames, parentToChildren } = parseRecipeCategories(recipes);

  return Array.from(parentNames.entries())
    .map(([parentSlug, name]) => {
      const item: CategoryItem = {
        name,
        url: `/recipes/${parentSlug}`,
      };
      const childrenMap = parentToChildren.get(parentSlug);
      if (childrenMap && childrenMap.size > 0) {
        item.children = Array.from(childrenMap.entries())
          .map(([childSlug, childName]) => ({
            name: childName,
            url: `/recipes/${parentSlug}/${childSlug}`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return item;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getHolidays(supabase: SupabaseClient) {
  const { data: dbHolidays, error: holidaysError } = await supabase
    .from('holidays')
    .select('name, slug');

  if (holidaysError) throw holidaysError;

  return (
    (dbHolidays as { name: string; slug: string }[] | null)?.map((h) => ({
      name: h.name,
      url: `/holidays/${h.slug}`,
    })) || []
  );
}

async function getSpecialDiets(supabase: SupabaseClient) {
  const { data: dbDiets, error: dietsError } = await supabase
    .from('special_diets')
    .select('name, slug');

  if (dietsError) throw dietsError;

  return (
    (dbDiets as { name: string; slug: string }[] | null)?.map((d) => ({
      name: d.name,
      url: `/special-diets/${d.slug}`,
    })) || []
  );
}

async function getCookingMethodsAndList(supabase: SupabaseClient) {
  const { data: dbMethods, error: methodsError } = await supabase
    .from('methods')
    .select('name, slug');

  if (methodsError) throw methodsError;

  const cookingMethods =
    (dbMethods as { name: string; slug: string }[] | null)
      ?.map((m) => ({
        name: m.name,
        url: `/methods/${m.slug}`,
        image: `/images/methods/${m.slug}.png`,
      }))
      .slice(0, 6) || [];

  const methodsList =
    (dbMethods as { name: string; slug: string }[] | null)?.map((m) => ({
      name: m.name,
      url: `/methods/${m.slug}`,
    })) || [];

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

function transformToBest(categories: CategoryItem[], theBest?: string): CategoryItem[] {
  return categories.map((cat) => {
    const bestName = `The Best ${cat.name}`;
    const slug = cat.url.split('/').at(-1) || '';
    const bestUrl = theBest ? `${theBest}/the-best-${slug}` : `/the-best-recipes/the-best-${slug}`;

    const item: CategoryItem = {
      name: bestName,
      url: bestUrl,
    };

    if (cat.children) {
      item.children = transformToBest(cat.children, bestUrl);
    }
    return item;
  });
}

async function getBestRecipes(supabase: SupabaseClient): Promise<CategoryItem[]> {
  const categoriesList = await getCategoriesList(supabase);
  return transformToBest(categoriesList);
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
