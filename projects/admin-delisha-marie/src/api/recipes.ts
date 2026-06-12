import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';

const recipesRouter = Router();

recipesRouter.use(authMiddleware);

recipesRouter.get('/recipes', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const { data, error } = await client
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

recipesRouter.post('/recipes', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const { data, error } = await client.from('recipes').insert(req.body).select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.put('/recipes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const updateBody = { ...req.body };
    delete updateBody.id; // Prevent trying to update the primary key id column

    const { data, error } = await client
      .from('recipes')
      .update(updateBody)
      .eq('id', req.params['id'])
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.delete('/recipes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const client = backendService.getClient(req.token);
    const { error } = await client.from('recipes').delete().eq('id', req.params['id']);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

export default recipesRouter;
