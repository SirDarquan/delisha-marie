import { NextFunction, Request, Response } from 'express';
import { backendService } from '../supabase-backend.service';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  custom_domain?: string | null;
}

export interface AuthRequest extends Request {
  user?: { id?: string; email?: string; [key: string]: unknown };
  token?: string;
  role?: 'admin' | 'member' | 'unassigned';
  status?: 'pending' | 'active' | 'blocked';
  tenantId?: string | null;
  tenant?: TenantInfo | null;
  isImpersonating?: boolean;
}

async function resolveUserProfile(
  user: { id?: string; email?: string } | null | undefined,
): Promise<{
  role: 'admin' | 'member' | 'unassigned';
  status: 'pending' | 'active' | 'blocked';
  tenantId: string | null;
  tenant: TenantInfo | null;
}> {
  if (!user?.id) {
    return { role: 'member', status: 'active', tenantId: null, tenant: null };
  }
  try {
    const adminClient = backendService.supabaseAdmin;
    if (!adminClient?.from) {
      return { role: 'member', status: 'active', tenantId: null, tenant: null };
    }

    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('role, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return { role: 'member', status: 'active', tenantId: null, tenant: null };
    }

    let tenant: TenantInfo | null = null;
    let tenantId: string | null = null;

    if (profile.role === 'member') {
      const { data: tenantData } = await adminClient
        .from('tenants')
        .select('id, name, slug, custom_domain')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (tenantData) {
        tenant = tenantData;
        tenantId = tenantData.id;
      }
    }

    return {
      role: profile.role || 'member',
      status: profile.status || 'active',
      tenantId,
      tenant,
    };
  } catch {
    return { role: 'member', status: 'active', tenantId: null, tenant: null };
  }
}

function shouldPropagateTokenError(err: unknown, refreshToken?: string): boolean {
  if (!refreshToken) {
    return true;
  }
  const isExpired = err instanceof Error && err.message.toLowerCase().includes('expired');
  return !isExpired;
}

async function tryVerifyToken(
  token: string,
  refreshToken?: string,
): Promise<{ id?: string; email?: string; [key: string]: unknown } | null> {
  try {
    return (await backendService.verifyToken(token)) as unknown as {
      id?: string;
      email?: string;
      [key: string]: unknown;
    };
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
): Promise<{
  user: { id?: string; email?: string; [key: string]: unknown };
  token: string;
} | null> {
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
    user: data.user as unknown as { id?: string; email?: string; [key: string]: unknown },
    token: data.session.access_token,
  };
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const token = req.cookies?.['admin_access_token'];
    const refreshToken = req.cookies?.['admin_refresh_token'];
    let verifiedUser: { id?: string; email?: string; [key: string]: unknown } | null = null;
    let activeToken = '';

    if (token) {
      verifiedUser = await tryVerifyToken(token, refreshToken);
      if (verifiedUser) {
        activeToken = token;
      }
    }

    if (!verifiedUser && refreshToken) {
      const session = await tryRefreshSession(res, refreshToken);
      if (session) {
        verifiedUser = session.user;
        activeToken = session.token;
      }
    }

    if (!verifiedUser) {
      res.status(401).json({ error: 'Token missing or invalid' });
      return;
    }

    const profileInfo = await resolveUserProfile(verifiedUser);

    if (profileInfo.status === 'pending') {
      res.status(403).json({
        error: 'Account is pending administrator approval.',
        code: 'ACCOUNT_PENDING',
      });
      return;
    }

    if (profileInfo.status === 'blocked') {
      res.status(403).json({
        error: 'Account has been blocked by administrator.',
        code: 'ACCOUNT_BLOCKED',
      });
      return;
    }

    authReq.user = verifiedUser;
    authReq.token = activeToken;
    authReq.role = profileInfo.role;
    authReq.status = profileInfo.status;
    authReq.tenantId = profileInfo.tenantId;
    authReq.tenant = profileInfo.tenant;
    authReq.isImpersonating = !!req.cookies?.['admin_original_token'];

    next();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(401).json({ error: 'Unauthorized: ' + msg });
  }
};

export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  if (authReq.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required', code: 'ADMIN_REQUIRED' });
    return;
  }
  next();
};

export const memberOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  if (authReq.role !== 'member') {
    res.status(403).json({ error: 'Forbidden: Member access required', code: 'MEMBER_REQUIRED' });
    return;
  }
  next();
};
