import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

export default async function search(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const supabase = await getSupabaseClient();
    const { query, page = 1, pageSize = 12 } = req.body || {};

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const { data, error } = await supabase.functions.invoke('search-recipes', {
      body: { query, page, pageSize },
    });

    if (error) {
      throw error;
    }

    const recipes = (data?.recipes as Record<string, unknown>[]) || [];
    const nowIso = new Date().toISOString();

    let validIdSet: Set<string>;
    const recipeIds = recipes
      .map((r) => r['id'])
      .filter((id): id is string | number => id !== undefined && id !== null)
      .map(String);

    if (recipeIds.length > 0) {
      const { data: liveRecipes, error: dbError } = await supabase
        .from('recipes')
        .select('id')
        .in('id', recipeIds)
        .eq('status', 'published')
        .lte('created_at', nowIso);

      if (dbError) {
        throw dbError;
      }

      validIdSet = new Set((liveRecipes || []).map((lr: { id: string | number }) => String(lr.id)));
    } else {
      validIdSet = new Set();
    }

    const items = recipes
      .filter((r) => {
        if (!validIdSet.has(String(r['id']))) {
          return false;
        }
        if (typeof r['created_at'] === 'string' && r['created_at'] > nowIso) {
          return false;
        }
        if (r['status'] && r['status'] !== 'published') {
          return false;
        }
        return true;
      })
      .map((r: Record<string, unknown>) => {
        const rCopy = { ...r };
        delete rCopy['total_count'];
        return rCopy;
      });

    const excludedCount = recipes.length - items.length;
    const total = Math.max(0, (data?.total || 0) - excludedCount);

    res.status(200).json({
      items,
      total,
    });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
}
