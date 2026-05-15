import { Router, Request, Response } from 'express';
import { backendService } from './supabase-backend.service';
import { authMiddleware, AuthRequest, setAuthCookies } from './middleware/auth.middleware';

const getSupabase = () => backendService.supabase;

async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('check_username_available', {
    check_username: username,
  });
  if (error) throw error;
  return !!data;
}

async function isEmailAvailable(email: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('check_email_available', {
    check_email: email,
  });
  if (error) throw error;
  return !!data;
}

async function getEmailByUsername(username: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc('get_email_by_username', {
    username,
  });
  if (error) throw error;
  return data;
}

async function signUp(email: string, password: string, data: Record<string, unknown> = {}) {
  const { data: authData, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data },
  });
  if (error) throw error;
  return authData;
}

async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

async function signInWithIdToken(token: string, provider: 'google' | 'apple' = 'google') {
  const { data, error } = await getSupabase().auth.signInWithIdToken({
    provider,
    token,
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

const authRouter = Router();

authRouter.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const data = await signUp(email, password, { username });
    if (data.session) {
      setAuthCookies(res, data.session);
    }
    return res.json({
      message: 'User signed up successfully!',
      user: data.user,
      session: data.session,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

authRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    let email = username;
    // Map username to email if it doesn't contain @
    if (!username.includes('@')) {
      const foundEmail = await getEmailByUsername(username);
      if (foundEmail) {
        email = foundEmail;
      } else {
        email = `${username}@example.com`;
      }
    }

    const data = await signInWithPassword(email, password);
    if (data.session) {
      setAuthCookies(res, data.session);
    }
    return res.json({ session: data.session, user: data.user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(401).json({ error: msg });
  }
});

authRouter.post('/auth/social-login', async (req: Request, res: Response) => {
  try {
    const { token, provider } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const data = await signInWithIdToken(token, provider || 'google');
    if (data.session) {
      setAuthCookies(res, data.session);
    }
    return res.json({ success: true, session: data.session, user: data.user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

authRouter.post('/auth/signout', async (_req: Request, res: Response) => {
  try {
    await signOut();
    res.clearCookie('admin_access_token', { path: '/' });
    res.clearCookie('admin_refresh_token', { path: '/' });
    return res.json({ message: 'Signed out successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

authRouter.get('/auth/me', authMiddleware, (req: Request, res: Response) => {
  return res.json({ user: (req as AuthRequest).user });
});

authRouter.get('/auth/check-username', async (req: Request, res: Response) => {
  try {
    const username = req.query['username'] as string;
    if (!username) {
      return res.status(400).json({ error: 'Username query parameter is required' });
    }
    const available = await isUsernameAvailable(username);
    return res.json({ available });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

authRouter.get('/auth/check-email', async (req: Request, res: Response) => {
  try {
    const email = req.query['email'] as string;
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }
    const available = await isEmailAvailable(email);
    return res.json({ available });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

export default authRouter;
