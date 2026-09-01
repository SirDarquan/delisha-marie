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

    const recipes = data.recipes || [];
    const items = recipes.map((r: Record<string, unknown>) => {
      const rCopy = { ...r };
      delete rCopy['total_count'];
      return rCopy;
    });

    res.status(200).json({
      items,
      total: data.total || 0,
    });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
}
