import { isPlatformServer } from '@angular/common';
import { HttpHandlerFn, HttpHeaders, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID, REQUEST } from '@angular/core';

function isApiRequest(url: string): boolean {
  return (
    url.startsWith('/api/') ||
    url.startsWith('/kitchen/api/') ||
    url === '/config' ||
    url === '/kitchen/config'
  );
}

function resolveBaseUrl(
  env: Record<string, string | undefined>,
  incomingRequest?: unknown,
): string {
  if (env['VERCEL_URL']) {
    const isLocal =
      env['VERCEL_URL'].includes('localhost') || env['VERCEL_URL'].includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    return `${protocol}://${env['VERCEL_URL']}`;
  }
  if (env['VERCEL_PROJECT_PRODUCTION_URL']) {
    const isLocal =
      env['VERCEL_PROJECT_PRODUCTION_URL'].includes('localhost') ||
      env['VERCEL_PROJECT_PRODUCTION_URL'].includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    return `${protocol}://${env['VERCEL_PROJECT_PRODUCTION_URL']}`;
  }

  const forwardedHost = getHeaderValue(incomingRequest, 'x-forwarded-host');
  const forwardedPort = getHeaderValue(incomingRequest, 'x-forwarded-port');
  const forwardedProto = getHeaderValue(incomingRequest, 'x-forwarded-proto');

  if (forwardedHost) {
    const hasPort = forwardedHost.includes(':');
    const hostWithPort =
      hasPort || !forwardedPort ? forwardedHost : `${forwardedHost}:${forwardedPort}`;
    const isLocal = hostWithPort.includes('localhost') || hostWithPort.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : forwardedProto || 'https';
    return `${protocol}://${hostWithPort}`;
  }

  const incomingHost = getHeaderValue(incomingRequest, 'host');
  if (
    incomingHost &&
    !incomingHost.startsWith('127.0.0.1:') &&
    !incomingHost.startsWith('localhost:')
  ) {
    const isLocal = incomingHost.includes('localhost') || incomingHost.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    return `${protocol}://${incomingHost}`;
  }

  const port = env['PORT'] || '4201';
  return `http://localhost:${port}`;
}

function getHeaderValue(incomingRequest: unknown, name: string): string | null {
  if (!incomingRequest || typeof incomingRequest !== 'object') {
    return null;
  }
  const reqObj = incomingRequest as {
    headers?: Headers | Record<string, string | string[] | undefined>;
  };
  if (!reqObj.headers) {
    return null;
  }
  if (typeof (reqObj.headers as Headers).get === 'function') {
    return (reqObj.headers as Headers).get(name);
  }
  const dict = reqObj.headers as Record<string, string | string[] | undefined>;
  const val = dict[name] ?? dict[name.toLowerCase()];
  if (Array.isArray(val)) {
    return val.join('; ');
  }
  return val || null;
}

function forwardHeaderIfMissing(
  headers: HttpHeaders,
  name: string,
  value: string | null | undefined,
): HttpHeaders {
  if (value && !headers.has(name)) {
    return headers.set(name, value);
  }
  return headers;
}

function enrichHeaders(
  reqHeaders: HttpHeaders,
  env: Record<string, string | undefined>,
  incomingRequest: unknown,
): HttpHeaders {
  let headers = forwardHeaderIfMissing(
    reqHeaders,
    'x-vercel-protection-bypass',
    env['VERCEL_AUTOMATION_BYPASS_SECRET'],
  );

  if (incomingRequest) {
    headers = forwardHeaderIfMissing(headers, 'cookie', getHeaderValue(incomingRequest, 'cookie'));
    headers = forwardHeaderIfMissing(
      headers,
      'x-vercel-protection-bypass',
      getHeaderValue(incomingRequest, 'x-vercel-protection-bypass'),
    );
    headers = forwardHeaderIfMissing(
      headers,
      'authorization',
      getHeaderValue(incomingRequest, 'authorization'),
    );
  }

  return headers;
}

export const vercelAbsoluteUrlInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const platformId = inject(PLATFORM_ID);
  if (!isApiRequest(req.url) || !isPlatformServer(platformId)) {
    return next(req);
  }

  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const incomingRequest = inject(REQUEST, { optional: true });
  const baseUrl = resolveBaseUrl(env, incomingRequest);
  const headers = enrichHeaders(req.headers, env, incomingRequest);

  let newReq = req.clone({
    url: `${baseUrl}${req.url}`,
    headers,
  });

  if (newReq.headers.has('host')) {
    newReq = newReq.clone({ headers: newReq.headers.delete('host') });
  }

  return next(newReq);
};
