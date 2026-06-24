import DescopeClient from '@descope/node-sdk';
import { Request, Response, Router } from 'express';
import { authMiddleware, AuthRequest, setAuthCookies } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';

function cleanEnvValue(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed;
}

async function signInPasswordlessly(email: string) {
  const { data: linkData, error: linkError } = await getSupabaseAdmin().auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkError) throw linkError;

  const tokenHash = linkData?.properties?.hashed_token;
  if (!tokenHash) {
    throw new Error('Failed to generate secure verification token from Supabase');
  }

  const { data: sessionData, error: sessionError } = await getSupabase().auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });
  if (sessionError) throw sessionError;

  return sessionData;
}

let cachedDescopeClient: ReturnType<typeof DescopeClient> | null = null;
let lastUsedProjectId = '';

function getDescopeClient(): ReturnType<typeof DescopeClient> {
  const currentProjectId = cleanEnvValue(process.env['DESCOPE_PROJECT_ID']) || '';
  const currentManagementKey = cleanEnvValue(process.env['DESCOPE_MANAGEMENT_KEY']);

  if (!cachedDescopeClient || lastUsedProjectId !== currentProjectId) {
    cachedDescopeClient = DescopeClient({
      projectId: currentProjectId,
      ...(currentManagementKey ? { managementKey: currentManagementKey } : {}),
    });
    lastUsedProjectId = currentProjectId;
  }
  return cachedDescopeClient;
}

const getSupabase = () => backendService.supabase;
const getSupabaseAdmin = () => backendService.supabaseAdmin;

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

// 1. Send Descope OTP
authRouter.post('/auth/descope/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const isNew = await isEmailAvailable(email);
    const resp = await getDescopeClient().otp.signUpOrIn.email(email);
    if (!resp.ok) {
      return res.status(400).json({ error: resp.error?.errorDescription || 'Failed to send OTP' });
    }
    return res.json({ success: true, isNewUser: isNew });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

async function handleDescopeVerification(
  email: string,
  descopeToken: string,
  res: Response,
): Promise<Response> {
  // Fetch existing user from Supabase
  const {
    data: { users },
    error: listError,
  } = await getSupabaseAdmin().auth.admin.listUsers();
  if (listError) throw listError;

  const userExists = users.some((u) => u.email === email);
  if (!userExists) {
    return res.json({
      success: true,
      isNewUser: true,
      descopeToken,
      user: { email },
    });
  }

  // Sign in passwordlessly by generating and verifying a magic link token hash on the backend
  const sessionData = await signInPasswordlessly(email);
  if (sessionData.session) {
    setAuthCookies(res, sessionData.session);
  }

  return res.json({
    success: true,
    isNewUser: false,
    session: sessionData.session,
    user: sessionData.user,
  });
}

// 2. Verify Descope OTP (for existing users)
authRouter.post('/auth/descope/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    // Verify Descope OTP
    const verifyResp = await getDescopeClient().otp.verify.email(email, code);
    if (!verifyResp.ok) {
      return res
        .status(401)
        .json({ error: verifyResp.error?.errorDescription || 'Invalid OTP code' });
    }

    return await handleDescopeVerification(email, verifyResp.data?.sessionJwt || '', res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

async function validateDescopeSession(descopeToken: string): Promise<void> {
  try {
    await getDescopeClient().validateSession(descopeToken);
  } catch (descopeValErr) {
    console.error('Descope session validation failed:', descopeValErr);
    // Fallback offline parsing to decode the JWT payload and verify expiration
    try {
      const payload = JSON.parse(Buffer.from(descopeToken.split('.')[1], 'base64').toString());
      if (!payload || (payload.exp && payload.exp < Date.now() / 1000)) {
        throw new Error('Descope verification session has expired. Please verify OTP again.', {
          cause: descopeValErr,
        });
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.message.includes('expired')
          ? e.message
          : 'Invalid verification session token. Please verify OTP again.';
      throw new Error(msg, { cause: e });
    }
  }
}

async function syncDescopeUser(email: string, firstName: string, lastName: string): Promise<void> {
  if (!cleanEnvValue(process.env['DESCOPE_MANAGEMENT_KEY'])) return;
  try {
    await getDescopeClient().management.user.create(email, {
      email,
      displayName: `${firstName} ${lastName}`,
      verifiedEmail: true,
    });
  } catch {
    // If user already exists in Descope (e.g. created on OTP trigger), update them instead
    try {
      await getDescopeClient().management.user.update(email, {
        email,
        displayName: `${firstName} ${lastName}`,
        verifiedEmail: true,
      });
    } catch (e) {
      console.error('Failed to create/update Descope user profile:', e);
    }
  }
}

async function generateUniqueUsername(displayName: string, email: string): Promise<string> {
  let cleanUsername = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
  if (!cleanUsername) {
    cleanUsername =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '') || 'user';
  }

  let isAvailable = await isUsernameAvailable(cleanUsername);
  let attempts = 0;
  while (!isAvailable && attempts < 10) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const testUsername = `${cleanUsername}${suffix}`;
    isAvailable = await isUsernameAvailable(testUsername);
    if (isAvailable) {
      cleanUsername = testUsername;
      break;
    }
    attempts++;
  }
  return cleanUsername;
}

// 3. Register User with Descope & Supabase Sync (for new users)
authRouter.post('/auth/descope/register', async (req: Request, res: Response) => {
  try {
    const { email, descopeToken, firstName, lastName, displayName } = req.body;
    if (!email || !descopeToken || !firstName || !lastName || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify Descope session token
    try {
      await validateDescopeSession(descopeToken);
    } catch (descopeErr: unknown) {
      const msg = descopeErr instanceof Error ? descopeErr.message : String(descopeErr);
      return res.status(401).json({ error: msg });
    }

    // Try to create/update user in Descope using management API if management key is available
    await syncDescopeUser(email, firstName, lastName);

    // Generate a clean and unique username from displayName to satisfy database triggers/constraints
    const cleanUsername = await generateUniqueUsername(displayName, email);

    // Create user in Supabase with metadata (no password required for passwordless users)
    const { error: createError } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        username: cleanUsername,
      },
    });
    if (createError) throw createError;

    // Sign in passwordlessly by generating and verifying a magic link token hash on the backend
    const sessionData = await signInPasswordlessly(email);
    if (sessionData.session) {
      setAuthCookies(res, sessionData.session);
    }

    return res.json({ success: true, session: sessionData.session, user: sessionData.user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

// 4. Verify Descope OAuth
authRouter.post('/auth/descope/verify-oauth', async (req: Request, res: Response) => {
  try {
    const { email, descopeToken } = req.body;
    if (!email || !descopeToken) {
      return res.status(400).json({ error: 'Email and Descope token are required' });
    }

    // Verify Descope session token
    try {
      await validateDescopeSession(descopeToken);
    } catch (descopeErr: unknown) {
      const msg = descopeErr instanceof Error ? descopeErr.message : String(descopeErr);
      return res.status(401).json({ error: msg });
    }

    return await handleDescopeVerification(email, descopeToken, res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

export default authRouter;
