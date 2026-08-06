import { Router, Response, Request } from 'express';
import { getSupabaseClient } from './supabase';

const pagesRouter = Router();

// GET /api/pages/:slug - Get public page by slug
pagesRouter.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params['slug'];
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('pages')
      .select('slug, title, content, description, keywords, updated_at')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Page not found' });
        return;
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching page ${req.params['slug']}:`, message);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

export { pagesRouter };
