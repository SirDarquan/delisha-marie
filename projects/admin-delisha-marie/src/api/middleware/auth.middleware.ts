import { Request, Response, NextFunction } from 'express';
import { backendService } from '../supabase-backend.service';

export interface AuthRequest extends Request {
  user?: unknown;
  token?: string;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  try {
    const token = req.cookies && req.cookies['admin_access_token'];
    const refreshToken = req.cookies && req.cookies['admin_refresh_token'];

    if (token) {
      try {
        const user = await backendService.verifyToken(token);
        authReq.user = user;
        authReq.token = token;
        next();
        return;
      } catch (tokenErr: unknown) {
        // If the token is expired or invalid, we attempt to refresh it using the refresh token
        const isExpired =
          tokenErr instanceof Error && tokenErr.message.toLowerCase().includes('expired');
        if (!isExpired || !refreshToken) {
          throw tokenErr;
        }
      }
    }

    if (refreshToken) {
      const { data, error } = await backendService.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      if (data.session && data.user) {
        res.cookie('admin_access_token', data.session.access_token, {
          httpOnly: true,
          secure: false, // Ensure local dev compatibility
          sameSite: 'lax',
          path: '/',
          maxAge: data.session.expires_in * 1000,
        });

        if (data.session.refresh_token) {
          res.cookie('admin_refresh_token', data.session.refresh_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          });
        }

        authReq.user = data.user;
        authReq.token = data.session.access_token;
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
