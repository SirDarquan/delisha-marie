import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';

const pagesRouter = Router();

pagesRouter.use(authMiddleware);

// GET /api/pages - List pages
pagesRouter.get('/pages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = backendService.getClient(req.token);
    let query = client
      .from('pages')
      .select('id, slug, title, updated_at')
      .order('slug', { ascending: true });

    if (req.tenantId) {
      query = query.eq('tenant_id', req.tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// GET /api/pages/:slug - Get page by slug
pagesRouter.get('/pages/:slug', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slug = req.params['slug'];
    const client = backendService.getClient(req.token);
    let query = client.from('pages').select('*').eq('slug', slug);
    if (req.tenantId) {
      query = query.eq('tenant_id', req.tenantId);
    }
    const { data, error } = await query.single();

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

// PUT /api/pages/:slug - Upsert page content
pagesRouter.put('/pages/:slug', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slug = req.params['slug'];
    const { title, content, description, keywords } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const client = backendService.getClient(req.token);

    let findQuery = client.from('pages').select('id').eq('slug', slug);
    if (req.tenantId) {
      findQuery = findQuery.eq('tenant_id', req.tenantId);
    }
    const { data: existing, error: findError } = await findQuery.maybeSingle();

    if (findError) throw findError;

    const now = new Date().toISOString();
    let result;

    if (existing) {
      let updateQuery = client
        .from('pages')
        .update({ title, content, description, keywords, updated_at: now })
        .eq('id', existing.id);
      if (req.tenantId) {
        updateQuery = updateQuery.eq('tenant_id', req.tenantId);
      }
      const { data, error } = await updateQuery.select().single();
      if (error) throw error;
      result = data;
    } else {
      const insertPayload: Record<string, unknown> = {
        slug,
        title,
        content,
        description,
        keywords,
        updated_at: now,
        created_at: now,
      };
      if (req.tenantId) {
        insertPayload['tenant_id'] = req.tenantId;
      }
      const { data, error } = await client.from('pages').insert(insertPayload).select().single();
      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

export { pagesRouter };
