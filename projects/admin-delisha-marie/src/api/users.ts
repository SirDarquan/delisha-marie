import { Request, Response, Router } from 'express';
import { adminOnlyMiddleware, authMiddleware, AuthRequest } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';

const usersRouter = Router();

// Exit impersonation only requires the admin_original_token cookie
usersRouter.post('/auth/exit-impersonation', async (req: Request, res: Response) => {
  const originalToken = req.cookies?.['admin_original_token'];
  if (!originalToken) {
    return res.status(400).json({ error: 'No active impersonation session found' });
  }

  res.clearCookie('admin_original_token', { path: '/' });
  res.cookie('admin_access_token', originalToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });

  return res.json({ success: true, message: 'Returned to administrator session' });
});

// Apply authMiddleware to all protected routes in this router
usersRouter.use(authMiddleware);

function getSupabaseAdmin() {
  return backendService.supabaseAdmin;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function signInPasswordlessly(email: string) {
  const { data: linkData, error: linkError } = await getSupabaseAdmin().auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkError) throw linkError;

  const tokenHash = linkData?.properties?.hashed_token;
  if (!tokenHash) {
    throw new Error('Failed to generate verification token');
  }

  const { data: sessionData, error: sessionError } = await backendService.supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });
  if (sessionError) throw sessionError;

  return sessionData;
}

// 1. GET /admin/users - List all users with tenant info
usersRouter.get('/admin/users', adminOnlyMiddleware, async (_req: Request, res: Response) => {
  try {
    const { data: profiles, error: profileErr } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('id, user_id, email, role, status, approved_at, approved_by, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (profileErr) throw profileErr;

    const { data: tenants, error: tenantErr } = await getSupabaseAdmin()
      .from('tenants')
      .select('id, name, slug, custom_domain, is_public, owner_id');

    if (tenantErr) throw tenantErr;

    const tenantMap = new Map((tenants || []).map((t) => [t.owner_id, t]));

    const users = (profiles || []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      email: p.email,
      role: p.role,
      status: p.status,
      approvedAt: p.approved_at,
      approvedBy: p.approved_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      tenant: tenantMap.get(p.user_id) || null,
    }));

    return res.json({ users });
  } catch (err: unknown) {
    return res.status(500).json({ error: getErrorMessage(err) });
  }
});

// 2. GET /admin/waiting-room - List only pending users
usersRouter.get(
  '/admin/waiting-room',
  adminOnlyMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const { data: pendingUsers, error } = await getSupabaseAdmin()
        .from('user_profiles')
        .select('id, user_id, email, role, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ pendingUsers: pendingUsers || [] });
    } catch (err: unknown) {
      return res.status(500).json({ error: getErrorMessage(err) });
    }
  },
);

// 3. POST /admin/users/:id/approve - Approve a user as member or admin
usersRouter.post(
  '/admin/users/:id/approve',
  adminOnlyMiddleware,
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const targetId = req.params['id'];
    const { role, tenantName, slug, customDomain } = req.body;

    if (!role || (role !== 'member' && role !== 'admin')) {
      return res.status(400).json({ error: "Role must be either 'member' or 'admin'" });
    }

    try {
      const { data: profile, error: findErr } = await getSupabaseAdmin()
        .from('user_profiles')
        .select('id, user_id, email, status')
        .or(`id.eq.${targetId},user_id.eq.${targetId}`)
        .single();

      if (findErr || !profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      if (role === 'member') {
        const finalSlug = (slug || profile.email.split('@')[0] || 'member')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-');
        const finalName = tenantName || `${profile.email.split('@')[0]}'s Kitchen`;

        const { error: tenantErr } = await getSupabaseAdmin()
          .from('tenants')
          .insert({
            name: finalName,
            slug: finalSlug,
            custom_domain: customDomain || null,
            is_public: true,
            owner_id: profile.user_id,
          });

        if (tenantErr) throw tenantErr;
      }

      const { error: updateErr } = await getSupabaseAdmin()
        .from('user_profiles')
        .update({
          role,
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: authReq.user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      return res.json({ success: true, message: `User approved as ${role}` });
    } catch (err: unknown) {
      return res.status(500).json({ error: getErrorMessage(err) });
    }
  },
);

// 4. POST /admin/users/:id/block - Block user
usersRouter.post(
  '/admin/users/:id/block',
  adminOnlyMiddleware,
  async (req: Request, res: Response) => {
    const targetId = req.params['id'];
    try {
      const { data: profile, error: findErr } = await getSupabaseAdmin()
        .from('user_profiles')
        .select('id, user_id, email, role')
        .or(`id.eq.${targetId},user_id.eq.${targetId}`)
        .single();

      if (findErr || !profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      if (profile.role === 'admin') {
        return res.status(400).json({ error: 'Cannot block an administrator' });
      }

      const { error: updateErr } = await getSupabaseAdmin()
        .from('user_profiles')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      return res.json({ success: true, message: 'User has been blocked' });
    } catch (err: unknown) {
      return res.status(500).json({ error: getErrorMessage(err) });
    }
  },
);

// 5. POST /admin/users/:id/unblock - Unblock user
usersRouter.post(
  '/admin/users/:id/unblock',
  adminOnlyMiddleware,
  async (req: Request, res: Response) => {
    const targetId = req.params['id'];
    try {
      const { error } = await getSupabaseAdmin()
        .from('user_profiles')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .or(`id.eq.${targetId},user_id.eq.${targetId}`);

      if (error) throw error;
      return res.json({ success: true, message: 'User unblocked' });
    } catch (err: unknown) {
      return res.status(500).json({ error: getErrorMessage(err) });
    }
  },
);

// 6. POST /admin/users/:id/impersonate - Admin login as member without password
usersRouter.post(
  '/admin/users/:id/impersonate',
  adminOnlyMiddleware,
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const targetId = req.params['id'];

    try {
      const { data: profile, error: findErr } = await getSupabaseAdmin()
        .from('user_profiles')
        .select('id, user_id, email, role, status')
        .or(`id.eq.${targetId},user_id.eq.${targetId}`)
        .single();

      if (findErr || !profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (profile.role === 'admin') {
        return res.status(400).json({ error: 'Cannot impersonate another administrator' });
      }

      if (profile.status !== 'active') {
        return res
          .status(400)
          .json({ error: `Cannot impersonate user with status '${profile.status}'` });
      }

      const sessionData = await signInPasswordlessly(profile.email);
      if (!sessionData?.session) {
        return res.status(500).json({ error: 'Failed to establish member session' });
      }

      // Save admin original token in cookie
      if (authReq.token) {
        res.cookie('admin_original_token', authReq.token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 86400 * 1000,
        });
      }

      // Set active token to the member's session token
      res.cookie('admin_access_token', sessionData.session.access_token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: sessionData.session.expires_in * 1000,
      });

      return res.json({
        success: true,
        message: `Now impersonating ${profile.email}`,
        impersonatedUser: sessionData.user,
      });
    } catch (err: unknown) {
      return res.status(500).json({ error: getErrorMessage(err) });
    }
  },
);

// 7. PUT /admin/tenants/:id - Update tenant settings (slug, custom_domain, is_public)
usersRouter.put('/admin/tenants/:id', adminOnlyMiddleware, async (req: Request, res: Response) => {
  const tenantId = req.params['id'];
  const { name, slug, customDomain, isPublic } = req.body;

  try {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updatePayload['name'] = name;
    if (slug !== undefined) updatePayload['slug'] = slug;
    if (customDomain !== undefined) updatePayload['custom_domain'] = customDomain || null;
    if (isPublic !== undefined) updatePayload['is_public'] = isPublic;

    const { data: updated, error } = await getSupabaseAdmin()
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, tenant: updated });
  } catch (err: unknown) {
    return res.status(500).json({ error: getErrorMessage(err) });
  }
});

// 9. GET /auth/session - Returns the enriched session information
usersRouter.get('/auth/session', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  return res.json({
    user: authReq.user,
    role: authReq.role,
    status: authReq.status,
    tenantId: authReq.tenantId,
    tenant: authReq.tenant,
    isImpersonating: authReq.isImpersonating,
  });
});

export default usersRouter;
