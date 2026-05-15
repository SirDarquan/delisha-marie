import { Router, Request, Response } from 'express';
import { backendService } from './supabase-backend.service';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';

const recipesRouter = Router();

recipesRouter.use(authMiddleware);

recipesRouter.get('/recipes', async (req: Request, res: Response) => {
  try {
    const client = backendService.getClient((req as AuthRequest).token);
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

recipesRouter.post('/recipes', async (req: Request, res: Response) => {
  try {
    const client = backendService.getClient((req as AuthRequest).token);
    const { data, error } = await client.from('recipes').insert(req.body).select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.put('/recipes/:id', async (req: Request, res: Response) => {
  try {
    const client = backendService.getClient((req as AuthRequest).token);
    const { data, error } = await client
      .from('recipes')
      .update(req.body)
      .eq('id', req.params['id'] as string)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.delete('/recipes/:id', async (req: Request, res: Response) => {
  try {
    const client = backendService.getClient((req as AuthRequest).token);
    const { error } = await client
      .from('recipes')
      .delete()
      .eq('id', req.params['id'] as string);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

export default recipesRouter;
