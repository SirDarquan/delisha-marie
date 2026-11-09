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
  adminUser?: { id?: string; email?: string; [key: string]: unknown };
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

export const IMPERSONATION_IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour inactivity window
export const IMPERSONATION_MAX_CAP_MS = 8 * 60 * 60 * 1000; // 8 hours absolute max cap

export function clearImpersonationCookies(res: Response): void {
  res.clearCookie('admin_impersonate_user_id', { path: '/' });
  res.clearCookie('admin_impersonate_token', { path: '/' });
  res.clearCookie('admin_impersonate_refresh_token', { path: '/' });
  res.clearCookie('admin_impersonate_max_at', { path: '/' });
  res.clearCookie('admin_original_token', { path: '/' });
  res.clearCookie('admin_original_refresh_token', { path: '/' });
  res.clearCookie('admin_impersonated_user_id', { path: '/' });
}

export function setImpersonationCookies(
  res: Response,
  targetUserId: string,
  session?: { access_token?: string; refresh_token?: string; expires_in?: number },
  maxAt?: number,
): void {
  const now = Date.now();
  const absoluteMaxAt = maxAt ?? now + IMPERSONATION_MAX_CAP_MS;
  const remainingCap = absoluteMaxAt - now;

  if (remainingCap <= 0) {
    clearImpersonationCookies(res);
    return;
  }

  const maxAge = Math.min(IMPERSONATION_IDLE_TIMEOUT_MS, remainingCap);

  res.cookie('admin_impersonate_user_id', targetUserId, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  res.cookie('admin_impersonate_max_at', String(absoluteMaxAt), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  if (session?.access_token) {
    res.cookie('admin_impersonate_token', session.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  }
  if (session?.refresh_token) {
    res.cookie('admin_impersonate_refresh_token', session.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  }
}

export function clearAllAuthCookies(res: Response): void {
  res.clearCookie('admin_access_token', { path: '/' });
  res.clearCookie('admin_refresh_token', { path: '/' });
  clearImpersonationCookies(res);
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

async function authenticateUser(
  req: Request,
  res: Response,
): Promise<{
  user: { id?: string; email?: string; [key: string]: unknown };
  token: string;
} | null> {
  const token = req.cookies?.['admin_access_token'];
  const refreshToken = req.cookies?.['admin_refresh_token'];

  if (token) {
    const verified = await tryVerifyToken(token, refreshToken);
    if (verified) {
      return { user: verified, token };
    }
  }

  if (refreshToken) {
    const session = await tryRefreshSession(res, refreshToken);
    if (session) {
      return { user: session.user, token: session.token };
    }
  }

  return null;
}

function checkImpersonation(req: Request, res: Response, userId?: string, role?: string): boolean {
  const hasOriginalToken = Boolean(req.cookies?.['admin_original_token']);
  const impersonatedUserId =
    req.cookies?.['admin_impersonate_user_id'] || req.cookies?.['admin_impersonated_user_id'];
  const isMatch = !impersonatedUserId || userId === impersonatedUserId;
  const isActuallyImpersonating = hasOriginalToken && role === 'member' && isMatch;

  if (hasOriginalToken && !isActuallyImpersonating) {
    clearImpersonationCookies(res);
  }

  return isActuallyImpersonating;
}

async function fetchUserTenant(
  adminClient: typeof backendService.supabaseAdmin,
  userId: string,
): Promise<{ tenantId: string | null; tenant: TenantInfo | null }> {
  const { data: tenantData } = await adminClient
    .from('tenants')
    .select('id, name, slug, custom_domain')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!tenantData) {
    return { tenantId: null, tenant: null };
  }

  return {
    tenantId: tenantData.id,
    tenant: {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      custom_domain: tenantData.custom_domain,
    },
  };
}

async function resolveImpersonatedToken(
  req: Request,
  expectedUserId: string,
): Promise<{ token?: string; refreshToken?: string }> {
  let token = req.cookies?.['admin_impersonate_token'];
  let refreshToken = req.cookies?.['admin_impersonate_refresh_token'];

  if (token) {
    try {
      const verified = await backendService.verifyToken(token);
      if (verified?.id !== expectedUserId) {
        token = undefined;
      }
    } catch {
      token = undefined;
    }
  }

  if (!token && refreshToken) {
    try {
      const { data: refData, error: refErr } = await backendService.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (!refErr && refData?.session && refData.user?.id === expectedUserId) {
        token = refData.session.access_token;
        if (refData.session.refresh_token) {
          refreshToken = refData.session.refresh_token;
        }
      }
    } catch {
      // Refresh failed
    }
  }

  return {
    token: token || undefined,
    refreshToken: refreshToken || undefined,
  };
}

async function resolveImpersonation(
  req: Request,
  res: Response,
  targetUserId: string,
): Promise<{
  user: { id?: string; email?: string; [key: string]: unknown };
  token?: string;
  refreshToken?: string;
  tenantId: string | null;
  tenant: TenantInfo | null;
} | null> {
  const adminClient = backendService.supabaseAdmin;
  if (!adminClient?.from) return null;

  try {
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('id, user_id, email, role, status')
      .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
      .maybeSingle();

    if (profile?.status !== 'active' || profile?.role === 'admin') {
      return null;
    }

    const { tenantId, tenant } = await fetchUserTenant(adminClient, profile.user_id);
    const { token, refreshToken } = await resolveImpersonatedToken(req, profile.user_id);

    return {
      user: { id: profile.user_id, email: profile.email },
      token,
      refreshToken,
      tenantId,
      tenant,
    };
  } catch {
    return null;
  }
}

function checkAccountStatus(res: Response, status?: string): boolean {
  if (status === 'pending') {
    res.status(403).json({
      error: 'Account is pending administrator approval.',
      code: 'ACCOUNT_PENDING',
    });
    return false;
  }
  if (status === 'blocked') {
    res.status(403).json({
      error: 'Account has been blocked by administrator.',
      code: 'ACCOUNT_BLOCKED',
    });
    return false;
  }
  return true;
}

async function handleAdminImpersonation(
  req: Request,
  res: Response,
  authReq: AuthRequest,
  adminUserId?: string,
): Promise<void> {
  const impersonatedUserId =
    req.cookies?.['admin_impersonate_user_id'] || req.cookies?.['admin_impersonated_user_id'];
  const maxAtRaw = req.cookies?.['admin_impersonate_max_at'];
  const maxAt = maxAtRaw ? Number(maxAtRaw) : undefined;
  const now = Date.now();

  if (!impersonatedUserId || impersonatedUserId === adminUserId) {
    if (req.cookies?.['admin_original_token']) {
      clearImpersonationCookies(res);
    }
    return;
  }

  if (maxAt !== undefined && now >= maxAt) {
    clearImpersonationCookies(res);
    return;
  }

  const impContext = await resolveImpersonation(req, res, impersonatedUserId);
  if (!impContext) {
    clearImpersonationCookies(res);
    return;
  }

  authReq.user = impContext.user;
  if (impContext.token) {
    authReq.token = impContext.token;
  }
  authReq.tenantId = impContext.tenantId;
  authReq.tenant = impContext.tenant;
  authReq.isImpersonating = true;

  // Slide rolling 1-hour inactivity window, capped at 8-hour max
  const currentToken = impContext.token || req.cookies?.['admin_impersonate_token'];
  const currentRefreshToken =
    impContext.refreshToken || req.cookies?.['admin_impersonate_refresh_token'];
  setImpersonationCookies(
    res,
    impersonatedUserId,
    { access_token: currentToken, refresh_token: currentRefreshToken },
    maxAt,
  );
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const authResult = await authenticateUser(req, res);
    if (!authResult) {
      res.status(401).json({ error: 'Token missing or invalid' });
      return;
    }

    const profileInfo = await resolveUserProfile(authResult.user);
    if (!checkAccountStatus(res, profileInfo.status)) {
      return;
    }

    authReq.adminUser = authResult.user;
    authReq.user = authResult.user;
    authReq.token = authResult.token;
    authReq.role = profileInfo.role;
    authReq.status = profileInfo.status;
    authReq.tenantId = profileInfo.tenantId;
    authReq.tenant = profileInfo.tenant;
    authReq.isImpersonating = false;

    if (profileInfo.role === 'admin') {
      await handleAdminImpersonation(req, res, authReq, authResult.user.id);
    } else if (profileInfo.role === 'member' && req.cookies?.['admin_original_token']) {
      authReq.isImpersonating = checkImpersonation(req, res, authResult.user.id, profileInfo.role);
    }

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
