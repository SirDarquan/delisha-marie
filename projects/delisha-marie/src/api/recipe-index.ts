import { Router, Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

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

recipeIndexRouter.get('/recipe-index', async (req: Request, res: Response) => {
  try {
    const supabase = await getSupabaseClient();
    // 1. Fetch categories dynamically from published recipe breadcrumbs
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, breadcrumbs')
      .eq('status', 'published');

    if (recipesError) throw recipesError;

    const parentNames = new Map<string, string>();
    const parentToChildren = new Map<string, Map<string, string>>();

    (recipes as RecipeRow[] | null)?.forEach((r) => {
      const breadcrumbs = r.breadcrumbs as Breadcrumb[] | null;
      if (Array.isArray(breadcrumbs)) {
        breadcrumbs.forEach((gp) => {
          if (gp && Array.isArray(gp.items)) {
            gp.items.forEach((item) => {
              if (item && item.url && item.url.startsWith('/recipes/')) {
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

    const categoriesList: CategoryItem[] = Array.from(parentNames.entries())
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

    const featuredCategories = categoriesList.map((c) => ({
      name: c.name,
      url: c.url,
      image: `/images/categories/${c.url.split('/')[2]}.png`,
    }));

    // 2. Fetch cooking methods
    const { data: dbMethods, error: methodsError } = await supabase
      .from('methods')
      .select('name, slug');

    if (methodsError) throw methodsError;

    const cookingMethods =
      (dbMethods as { name: string; slug: string }[] | null)?.map((m) => ({
        name: m.name,
        url: `/methods/${m.slug}`,
        image: `/images/methods/${m.slug}.png`,
      })) || [];

    const methodsList =
      (dbMethods as { name: string; slug: string }[] | null)?.map((m) => ({
        name: m.name,
        url: `/methods/${m.slug}`,
      })) || [];

    // 3. Fetch holidays
    const { data: dbHolidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('name, slug');

    if (holidaysError) throw holidaysError;

    const holidays =
      (dbHolidays as { name: string; slug: string }[] | null)?.map((h) => ({
        name: h.name,
        url: `/holidays/${h.slug}`,
      })) || [];

    // 4. Fetch special diets
    const { data: dbDiets, error: dietsError } = await supabase
      .from('special_diets')
      .select('name, slug');

    if (dietsError) throw dietsError;

    const specialDiets =
      (dbDiets as { name: string; slug: string }[] | null)?.map((d) => ({
        name: d.name,
        url: `/special-diets/${d.slug}`,
      })) || [];

    // 5. Fetch ingredients with count of recipes using them
    const { data: dbIngredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('id, name, slug');

    if (ingredientsError) throw ingredientsError;

    // Get counts from recipe_ingredients join table
    const { data: relationCounts, error: countsError } = await supabase
      .from('recipe_ingredients')
      .select('recipe_id, ingredient_id');

    if (countsError) throw countsError;

    const publishedIds = new Set((recipes as RecipeRow[] | null)?.map((r) => r.id));
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

    // Grouping children hierarchically by prefix matching
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

    const finalIngredients = sortedIngs
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

    return res.json({
      featuredCategories,
      cookingMethods,
      categoriesList,
      methodsList,
      holidays,
      specialDiets,
      ingredients: finalIngredients,
    });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

export default recipeIndexRouter;
