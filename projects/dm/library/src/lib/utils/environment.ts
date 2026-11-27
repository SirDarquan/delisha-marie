export type AppEnvironment = 'local' | 'preview' | 'live';

export const LOCAL_BASE_URL = 'http://localhost:4200';

function getProcessEnv(): Record<string, string | undefined> {
  const globalProcess = (
    globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  ).process;
  return globalProcess?.env ?? {};
}

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  let withProtocol: string;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    withProtocol = trimmed;
  } else {
    const isLocal = trimmed.includes('localhost') || trimmed.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    withProtocol = `${protocol}://${trimmed}`;
  }
  return withProtocol.endsWith('/') ? withProtocol.slice(0, -1) : withProtocol;
}

/**
 * Resolves the application environment from VERCEL_ENV:
 * - VERCEL_ENV === 'production' -> 'live'
 * - VERCEL_ENV === 'preview' -> 'preview'
 * - Otherwise (not set or local) -> 'local'
 */
export function getAppEnvironment(
  env: Record<string, string | undefined> = getProcessEnv(),
): AppEnvironment {
  const vercelEnv = env['VERCEL_ENV'];
  if (vercelEnv === 'production') {
    return 'live';
  }
  if (vercelEnv === 'preview') {
    return 'preview';
  }
  return 'local';
}

/**
 * Resolves the application base URL from the current environment:
 * - 'local' -> 'http://localhost:4200'
 * - 'preview' -> VERCEL_URL (normalized with protocol)
 * - 'live' -> VERCEL_PROJECT_PRODUCTION_URL (normalized with protocol)
 */
export function getAppBaseUrl(env: Record<string, string | undefined> = getProcessEnv()): string {
  const appEnv = getAppEnvironment(env);

  if (appEnv === 'preview') {
    const previewUrl = env['VERCEL_URL'];
    return previewUrl ? normalizeUrl(previewUrl) : LOCAL_BASE_URL;
  }

  if (appEnv === 'live') {
    const productionUrl = env['VERCEL_PROJECT_PRODUCTION_URL'];
    return productionUrl ? normalizeUrl(productionUrl) : LOCAL_BASE_URL;
  }

  return LOCAL_BASE_URL;
}
