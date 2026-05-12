import { Router, Request, Response } from 'express';
import { backendService } from './supabase-backend.service';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';

const recipesRouter = Router();

recipesRouter.use(authMiddleware);

recipesRouter.get('/recipes', async (req: Request, res: Response) => {
  try {
    const data = await backendService.getRecipes((req as AuthRequest).token);
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

recipesRouter.post('/recipes', async (req: Request, res: Response) => {
  try {
    const data = await backendService.createRecipe(req.body, (req as AuthRequest).token);
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.put('/recipes/:id', async (req: Request, res: Response) => {
  try {
    const data = await backendService.updateRecipe(
      req.params['id'] as string,
      req.body,
      (req as AuthRequest).token,
    );
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

recipesRouter.delete('/recipes/:id', async (req: Request, res: Response) => {
  try {
    await backendService.deleteRecipe(req.params['id'] as string, (req as AuthRequest).token);
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

export default recipesRouter;
