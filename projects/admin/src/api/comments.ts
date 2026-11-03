import { Router, Response } from 'express';
import { backendService } from './supabase-backend.service';
import { AuthRequest, authMiddleware } from './middleware/auth.middleware';

const commentsRouter = Router();
commentsRouter.use(authMiddleware);

// GET /api/recipes/:recipeId/comments
commentsRouter.get('/recipes/:recipeId/comments', async (req: AuthRequest, res: Response) => {
  try {
    const { recipeId } = req.params as { recipeId: string };
    const client = backendService.getClient(req.token);

    let query = client.from('comments').select('*').eq('recipe_id', recipeId).eq('is_new', true);

    if (req.tenantId) {
      query = query.eq('tenant_id', req.tenantId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return res.json({ comments: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

// POST /api/recipes/:recipeId/comments/:id/reply
commentsRouter.post(
  '/recipes/:recipeId/comments/:id/reply',
  async (req: AuthRequest, res: Response) => {
    try {
      const { recipeId, id: parentId } = req.params as { recipeId: string; id: string };
      const { content } = req.body;
      const client = backendService.supabaseAdmin;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const reply: Record<string, unknown> = {
        recipe_id: recipeId,
        parent_id: parentId,
        author: 'Delisha Marie',
        email: 'admin@delishamarie.com', // fallback or actual if needed
        content: content,
        is_admin: true,
        status: 'approved',
        is_new: false,
      };

      if (req.tenantId) {
        reply['tenant_id'] = req.tenantId;
      }

      // Mark parent as no longer new
      let parentUpdate = client.from('comments').update({ is_new: false }).eq('id', parentId);
      if (req.tenantId) {
        parentUpdate = parentUpdate.eq('tenant_id', req.tenantId);
      }
      await parentUpdate;

      const { data, error } = await client.from('comments').insert([reply]).select().single();
      if (error) throw error;

      return res.json(data);
    } catch (err: unknown) {
      console.error('SUPABASE ERROR:', err);
      const e = err as Record<string, unknown>;
      const msg = e['message'] || e['details'] || String(err);
      return res.status(400).json({ error: msg });
    }
  },
);

// DELETE /api/recipes/:recipeId/comments/:id
commentsRouter.delete(
  '/recipes/:recipeId/comments/:id',
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const client = backendService.supabaseAdmin;

      let query = client.from('comments').delete().eq('id', id);
      if (req.tenantId) {
        query = query.eq('tenant_id', req.tenantId);
      }

      const { error } = await query;
      if (error) throw error;

      return res.json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ error: msg });
    }
  },
);

// PATCH /api/recipes/:recipeId/comments/:id/skip
commentsRouter.patch(
  '/recipes/:recipeId/comments/:id/skip',
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const { skipped } = req.body; // true to skip, false to undo skip (approved)
      const client = backendService.supabaseAdmin;

      const is_new = !skipped;

      let query = client
        .from('comments')
        .update({ status: skipped ? 'skipped' : 'approved', is_new })
        .eq('id', id);

      if (req.tenantId) {
        query = query.eq('tenant_id', req.tenantId);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;

      return res.json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ error: msg });
    }
  },
);

export default commentsRouter;
