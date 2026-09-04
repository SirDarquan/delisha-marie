import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

export default async function pagesHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      res.setHeader(
        'Cache-Control',
        'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
      );
    }
    // Vercel automatically populates req.query based on the filename (e.g. [slug].ts)
    // For local testing where slug might not be populated, fallback to path parsing
    const slug = req.query['slug'] as string;

    if (!slug || req.method !== 'GET') {
      res.status(404).json({ error: 'Not found' });
      return;
    }

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
  } catch (err) {
    console.error('Error in pages handler:', err);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
}
