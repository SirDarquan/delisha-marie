import { isPlatformServer } from '@angular/common';
import { HttpHandlerFn, HttpHeaders, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID, REQUEST } from '@angular/core';

function isApiRequest(url: string): boolean {
  return url.startsWith('/api/') || url.startsWith('/kitchen/api/');
}

function resolveBaseUrl(env: Record<string, string | undefined>): string {
  const host = env['VERCEL_URL'] || env['VERCEL_PROJECT_PRODUCTION_URL'] || 'localhost:4200';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
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
  const baseUrl = resolveBaseUrl(env);
  const incomingRequest = inject(REQUEST, { optional: true });
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
