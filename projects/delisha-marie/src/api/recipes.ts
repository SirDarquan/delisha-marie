import { Router, Request, Response } from 'express';
import { camelCase } from 'change-case';
import { getSupabaseClient } from './supabase';
import { rateLimit } from 'express-rate-limit';
import type { SupabaseClient } from '@supabase/supabase-js';

const recipesRouter = Router();

const commentsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env['NODE_ENV'] === 'production' ? 5 : 100, // Limit each IP to 5 requests per windowMs (100 for dev/test)
  message: { error: 'Too many comments from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

interface SupabaseQueryBuilder {
  eq: (col: string, val: unknown) => SupabaseQueryBuilder;
  or: (
    filter: string,
    options?: { foreignTable?: string; referencedTable?: string },
  ) => SupabaseQueryBuilder;
  in: (col: string, vals: unknown[]) => SupabaseQueryBuilder;
  order: (
    col: string,
    options?: {
      ascending?: boolean;
      nullsFirst?: boolean;
      foreignTable?: string;
      referencedTable?: string;
    },
  ) => SupabaseQueryBuilder;
  range: (
    from: number,
    to: number,
    options?: { foreignTable?: string; referencedTable?: string },
  ) => SupabaseQueryBuilder;
  then: (
    onfulfilled?: ((value: unknown) => unknown) | null,
    onrejected?: ((reason: unknown) => unknown) | null,
  ) => Promise<unknown>;
  [key: string]: unknown;
}

function applyRecipeFilters(
  query: SupabaseQueryBuilder,
  method: string,
  category: string,
  subcategory: string,
  matchedIds: string[],
): SupabaseQueryBuilder {
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

recipesRouter.post('/recipes/search', async (req: Request, res: Response) => {
  try {
    const supabase = await getSupabaseClient();
    const { query, page = 1, pageSize = 12 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const { data, error } = await supabase.functions.invoke('search-recipes', {
      body: { query, page, pageSize },
    });

    if (error) {
      throw error;
    }

    const recipes = data.recipes || [];
    const items = recipes.map((r: Record<string, unknown>) => {
      const rCopy = { ...r };
      delete rCopy['total_count'];
      return rCopy;
    });

    return res.json({
      items,
      total: data.total || 0,
    });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

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

    let query: SupabaseQueryBuilder = supabase
      .from('recipes')
      .select(selectStr, { count: 'exact' }) as unknown as SupabaseQueryBuilder;
    query = query.eq('status', 'published');
    query = applyRecipeFilters(query, method, category, subcategory, matchedIds);

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = (await query) as {
      data: unknown;
      error: unknown;
      count: number | null;
    };
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
): Promise<{ main: number; items: { label: string; url?: string }[][] }> {
  const { data: recipeCatsData, error: catsError } = await supabase
    .from('recipe_categories')
    .select('categories (id, name, url)')
    .eq('recipe_id', recipeId);
  if (catsError) throw catsError;

  const categories = (recipeCatsData || [])
    .map((rc) => (rc as unknown as CategoryRelation).categories)
    .filter((cat): cat is CategoryInfo => cat !== null);

  const breadcrumbItems: { label: string; url?: string }[][] = [];

  if (categories.length === 0) {
    const mainLabel = formatted.theBest ? 'The Best Recipes' : 'Recipes';
    const mainUrl = formatted.theBest ? '/the-best-recipes' : '/recipes';
    breadcrumbItems.push([
      { label: 'Home', url: '/' },
      { label: mainLabel, url: mainUrl },
      { label: formatted.title, url: '/recipe/' + formatted.slug },
    ]);
    return { main: 0, items: breadcrumbItems };
  }

  categories.forEach((cat) => {
    const isBest = cat.url.startsWith('/the-best-recipes');
    const mainLabel = isBest ? 'The Best Recipes' : 'Recipes';
    const mainUrl = isBest ? '/the-best-recipes' : '/recipes';

    breadcrumbItems.push([
      { label: 'Home', url: '/' },
      { label: mainLabel, url: mainUrl },
      { label: cat.name, url: cat.url },
      { label: formatted.title, url: '/recipe/' + formatted.slug },
    ]);
  });

  const prefixUrl = formatted.theBest ? '/the-best-recipes' : '/recipes';
  let mainIndex = breadcrumbItems.findIndex((trail) => trail[1].url === prefixUrl);
  if (mainIndex === -1) mainIndex = 0;

  return { main: mainIndex, items: breadcrumbItems };
}

recipesRouter.get('/recipes/:recipeId/comments', async (req: Request, res: Response) => {
  try {
    const supabase = await getSupabaseClient();
    const { recipeId } = req.params as { recipeId: string };
    const pageVal = req.query['page'];

    // First count exact total top-level comments for this recipe
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId)
      .eq('status', 'approved')
      .is('parent_id', null);

    if (countError) throw countError;

    const total = count || 0;
    const pageSize = 50;
    const lastPage = Math.max(1, Math.ceil(total / pageSize));

    // Default to the last page if not specified or invalid
    const p = pageVal ? Number.parseInt(pageVal as string, 10) : lastPage;

    // Calculate offset and limit for top-level comments
    const end = total - (lastPage - p) * pageSize;
    const start = Math.max(0, end - pageSize);
    const limit = end - start;
    const offset = start;

    let topLevelComments: unknown[] = [];
    if (total > 0 && limit > 0) {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('status', 'approved')
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (fetchError) throw fetchError;
      topLevelComments = data || [];
    }

    let replies: unknown[] = [];
    if (topLevelComments.length > 0) {
      const topIds = (topLevelComments as { id: string }[]).map((c) => c.id);
      const { data: replyData, error: replyError } = await supabase
        .from('comments')
        .select('*')
        .in('parent_id', topIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (replyError) throw replyError;
      replies = replyData || [];
    }

    // Combine and camelCase keys
    const combined = [...topLevelComments, ...replies];
    const camelCased = camelCaseKeys(combined) as unknown[];

    return res.json({
      comments: camelCased,
      total: total,
    });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

function isDomainBlocked(
  website: string | undefined,
  blockedDomainsStr: string | undefined,
): boolean {
  if (!website || !blockedDomainsStr) return false;
  const blockedDomains = blockedDomainsStr.split(',').map((d) => d.trim().toLowerCase());
  const websiteLower = website.toLowerCase();
  return blockedDomains.some((domain) => domain && websiteLower.includes(domain));
}

recipesRouter.post(
  '/recipes/:recipeId/comments',
  commentsLimiter,
  async (req: Request, res: Response) => {
    try {
      const supabase = await getSupabaseClient();
      const { recipeId } = req.params as { recipeId: string };
      const { author, email, content, rating, website, parentId, alt_email } = req.body;

      if (!author || !email || !content) {
        return res.status(400).json({ error: 'Name, email, and content are required' });
      }

      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['require_comment_approval', 'blocked_domains', 'comment_new_cutoff_seconds']);

      const settings =
        settingsData?.reduce(
          (acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
          },
          {} as Record<string, string>,
        ) || {};

      if (isDomainBlocked(website, settings['blocked_domains'])) {
        return res.status(400).json({ error: 'Sorry, you cannot link to this website.' });
      }

      if (alt_email) {
        // Honeypot tripped: save to spam_comments for research
        const spamObj = {
          recipe_id: recipeId,
          author,
          email,
          content,
          rating: rating ?? null,
          website: website || null,
          parent_id: parentId || null,
          trap_triggered: 'alt_email',
          trap_value: alt_email,
        };

        await supabase.from('spam_comments').insert([spamObj]);

        // Silently succeed
        return res.status(201).json({
          id: 'bot-' + Date.now(),
          recipeId,
          author,
          email,
          content,
          website: website || null,
          parentId: parentId || null,
          createdAt: new Date().toISOString(),
        });
      }

      const requireApproval = settings['require_comment_approval'] === 'true';
      const status = requireApproval ? 'pending' : 'approved';
      const { data: recipe } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();
      const isNew =
        Date.now() <
        Number(recipe.created_at) + Number(settings['comment_new_cutoff_seconds']) * 1000;

      const insertObj = {
        recipe_id: recipeId,
        author,
        email,
        content,
        rating: rating ?? null,
        website: website || null,
        parent_id: parentId || null,
        status,
        is_new: isNew,
      };

      const { data, error } = await supabase.from('comments').insert([insertObj]).select().single();

      if (error) throw error;

      const camelCased = camelCaseKeys(data);
      return res.status(201).json(camelCased);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  },
);

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
    const [breadcrumbsObj, prev, next] = await Promise.all([
      getBreadcrumbs(supabase, recipeData.id, formatted),
      getAdjacentRecipe(supabase, recipeData.id, 'prev'),
      getAdjacentRecipe(supabase, recipeData.id, 'next'),
    ]);

    formatted.breadcrumbs = breadcrumbsObj;
    formatted.navigation = {
      prev,
      next,
    };

    return res.json(formatted);
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

export default recipesRouter;
