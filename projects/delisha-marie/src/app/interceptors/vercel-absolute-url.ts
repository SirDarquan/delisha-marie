import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const vercelAbsoluteUrlInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const platformId = inject(PLATFORM_ID);

  if (req.url.startsWith('/api/')) {
    // Only prepend absolute URL during SSR. Browsers handle relative paths automatically.
    if (isPlatformServer(platformId)) {
      let env: Record<string, string | undefined> = {};
      if (typeof process !== 'undefined' && process.env) {
        env = process.env;
      }

      // Default to 4200 because Angular & Vercel Dev scripts use port 4200
      const host = env['VERCEL_URL'] || env['VERCEL_PROJECT_PRODUCTION_URL'] || 'localhost:4200';
      const protocol = host.includes('localhost') ? 'http' : 'https';

      let newReq = req.clone({ url: `${protocol}://${host}${req.url}` });

      // Node fetch strict validation prohibits sending the 'host' header manually in fetch requests.
      if (newReq.headers.has('host')) {
        newReq = newReq.clone({ headers: newReq.headers.delete('host') });
      }
      return next(newReq);
    }
    // For browser, just pass through (it handles relative paths automatically)
    return next(req);
  }
  return next(req);
};
