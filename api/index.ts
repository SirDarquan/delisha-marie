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
  const rawPath = typeof pathParam === 'string' ? pathParam : '';

  if (originalUri?.startsWith('/kitchen')) {
    req.url = originalUri;
  } else if (rawPath) {
    req.url = rawPath;
  } else {
    req.url = '/kitchen/';
  }
  (req as unknown as { originalUrl: string }).originalUrl = req.url;

  try {
    const ssrHandler = await getHandler();
    return await ssrHandler(req, res);
  } catch (err) {
    console.error('SSR Handler Error:', err);
    if (!res.headersSent) {
      return res.status(500).send('Internal Server Error');
    }
  }
}
