import { Router, Request, Response } from 'express';
import { camelCase } from 'change-case';
import { getSupabaseClient } from './recipe-index';

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

interface DbRecipe {
  id: string;
  recipe_holidays?: { holidays?: { name: string } | null }[] | null;
  recipe_special_diets?: { special_diets?: { name: string } | null }[] | null;
  recipe_methods?: { methods?: { name: string } | null }[] | null;
  method?: string;
  recipe_categories?: unknown;
  recipe_ingredients?: unknown;
  [key: string]: unknown;
}

recipesRouter.get('/recipes', async (req: Request, res: Response) => {
  try {
    const supabase = await getSupabaseClient();

    const page = parseInt(req.query['page'] as string, 10) || 1;
    const pageSize = parseInt(req.query['pageSize'] as string, 10) || 12;
    const method = (req.query['method'] as string) || 'recipes';
    const category = (req.query['category'] as string) || '';
    const subcategory = (req.query['subcategory'] as string) || '';

    let selectStr = `
      *,
      recipe_categories (
        categories (name, url)
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

    // Determine inner joins if filtering is needed
    if (category) {
      if (method === 'recipes' || method === 'the-best-recipes') {
        selectStr = `
          *,
          recipe_categories!inner (
            categories!inner (name, url)
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
      } else if (method === 'methods') {
        selectStr = `
          *,
          recipe_categories (
            categories (name, url)
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
      } else if (method === 'special-diets' || method === 'special-diet') {
        selectStr = `
          *,
          recipe_categories (
            categories (name, url)
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
      } else if (method === 'holiday' || method === 'holidays') {
        selectStr = `
          *,
          recipe_categories (
            categories (name, url)
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
      } else if (method === 'tag') {
        selectStr = `
          *,
          recipe_categories (
            categories (name, url)
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
    }

    let query = supabase.from('recipes').select(selectStr, { count: 'exact' });
    query = query.eq('status', 'published');

    if (method === 'the-best-recipes') {
      query = query.eq('the_best', true);
    }

    if (category) {
      if (method === 'recipes') {
        if (subcategory) {
          const catUrl = `/recipes/${category}/${subcategory}`;
          query = query.eq('recipe_categories.categories.url', catUrl);
        } else {
          query = query.or(`url.eq./recipes/${category},url.like./recipes/${category}/%`, {
            foreignTable: 'recipe_categories.categories',
          });
        }
      } else if (method === 'the-best-recipes') {
        if (subcategory) {
          const catUrl = `/the-best-recipes/${category}/${subcategory}`;
          query = query.eq('recipe_categories.categories.url', catUrl);
        } else {
          query = query.or(
            `url.eq./the-best-recipes/${category},url.like./the-best-recipes/${category}/%`,
            { foreignTable: 'recipe_categories.categories' },
          );
        }
      } else if (method === 'methods') {
        query = query.eq('recipe_methods.methods.slug', category);
      } else if (method === 'special-diets' || method === 'special-diet') {
        query = query.eq('recipe_special_diets.special_diets.slug', category);
      } else if (method === 'holiday' || method === 'holidays') {
        query = query.eq('recipe_holidays.holidays.slug', category);
      } else if (method === 'tag') {
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
        query = query.in('recipe_ingredients.ingredient_id', matchedIds);
      }
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    const formatted = (data || []).map((recipeRaw: unknown) => {
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
      };
    });

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

export default recipesRouter;
