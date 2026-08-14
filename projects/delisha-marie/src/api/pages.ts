import { Router, Response, Request } from 'express';
import { getSupabaseClient } from './supabase';

const pagesRouter = Router();

// GET /api/pages/:slug - Get public page by slug
pagesRouter.get('/pages/:slug', async (req: Request, res: Response): Promise<void> => {
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

export default pagesRouter;
