import type { VercelRequest, VercelResponse } from '@vercel/node';

type SsrModule = {
  reqHandler: (req: VercelRequest, res: VercelResponse) => unknown;
};

let handlerPromise: Promise<SsrModule> | null = null;

async function getHandler() {
  // Dynamic import evaluated at runtime so TypeScript doesn't require dist/ during build
handlerPromise ??= new Function(
      'specifier',
      'return import(specifier)',
    )('../dist/kitchen/server/server.mjs') as Promise<SsrModule>;
  return (await handlerPromise).reqHandler;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const originalUri = req.headers['x-forwarded-uri'] as string | undefined;
  const pathParam = req.query['path'];

  if (originalUri?.startsWith('/kitchen')) {
    req.url = originalUri;
  } else if (typeof pathParam === 'string') {
    const trimmed = pathParam.replace(/^\/+/, '');
    req.url = trimmed ? `/kitchen/${trimmed}` : '/kitchen';
  } else {
    req.url = '/kitchen';
  }

  const ssrHandler = await getHandler();
  return ssrHandler(req, res);
}
