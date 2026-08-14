import { getSupabaseClient } from './supabase';
import { Router, Request, Response } from 'express';

const searchRouter = Router();

searchRouter.post('/search', async (req: Request, res: Response) => {
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

export default searchRouter;
