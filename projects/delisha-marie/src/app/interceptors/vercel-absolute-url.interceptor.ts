import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

export const vercelAbsoluteUrlInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (req.url.startsWith('/api/')) {
    // Vercel injects VERCEL_URL dynamically. In local dev, it falls back to localhost.
    let env: Record<string, string | undefined> = {};
    if (typeof process !== 'undefined' && process.env) {
      env = process.env;
    } else if (
      typeof window !== 'undefined' &&
      (window as unknown as { process?: { env: Record<string, string> } }).process?.env
    ) {
      env = (window as unknown as { process?: { env: Record<string, string> } }).process?.env || {};
    }

    const host = env['VERCEL_PROJECT_PRODUCTION_URL'] || env['VERCEL_URL'] || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    let newReq = req.clone({ url: `${protocol}://${host}${req.url}` });

    // Node fetch strict validation prohibits sending the 'host' header manually in fetch requests.
    if (newReq.headers.has('host')) {
      newReq = newReq.clone({ headers: newReq.headers.delete('host') });
    }

    return next(newReq);
  }
  return next(req);
};
