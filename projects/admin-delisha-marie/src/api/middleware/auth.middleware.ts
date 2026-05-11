import { Request, Response, NextFunction } from 'express';
import { backendService } from '../supabase-backend.service';

export interface AuthRequest extends Request {
  user?: unknown;
  token?: string;
}

function shouldPropagateTokenError(err: unknown, refreshToken?: string): boolean {
  if (!refreshToken) {
    return true;
  }
  const isExpired = err instanceof Error && err.message.toLowerCase().includes('expired');
  return !isExpired;
}

async function tryVerifyToken(token: string, refreshToken?: string): Promise<unknown> {
  try {
    return await backendService.verifyToken(token);
  } catch (tokenErr: unknown) {
    if (shouldPropagateTokenError(tokenErr, refreshToken)) {
      throw tokenErr;
    }
    return null;
  }
}

export function setAuthCookies(
  res: Response,
  session: { access_token: string; refresh_token?: string; expires_in: number },
) {
  res.cookie('admin_access_token', session.access_token, {
    httpOnly: true,
    secure: false, // Ensure local dev compatibility
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in * 1000,
  });

  if (session.refresh_token) {
    res.cookie('admin_refresh_token', session.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}

async function tryRefreshSession(
  res: Response,
  refreshToken: string,
): Promise<{ user: unknown; token: string } | null> {
  const { data, error } = await backendService.supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  if (!data.session || !data.user) {
    return null;
  }

  setAuthCookies(res, data.session);

  return {
    user: data.user,
    token: data.session.access_token,
  };
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  try {
    const token = req.cookies?.['admin_access_token'];
    const refreshToken = req.cookies?.['admin_refresh_token'];

    if (token) {
      const user = await tryVerifyToken(token, refreshToken);
      if (user) {
        authReq.user = user;
        authReq.token = token;
        next();
        return;
      }
    }

    if (refreshToken) {
      const session = await tryRefreshSession(res, refreshToken);
      if (session) {
        authReq.user = session.user;
        authReq.token = session.token;
        next();
        return;
      }
    }

    return res.status(401).json({ error: 'Token missing or invalid' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(401).json({ error: 'Unauthorized: ' + msg });
  }
};
