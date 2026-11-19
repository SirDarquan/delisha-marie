import type { VercelRequest, VercelResponse } from '@vercel/node';

type SsrModule = {
  reqHandler: (req: VercelRequest, res: VercelResponse) => unknown;
};

let kitchenHandlerPromise: Promise<SsrModule> | null = null;
let homeHandlerPromise: Promise<SsrModule> | null = null;

async function getKitchenHandler() {
  // Dynamic import evaluated at runtime so TypeScript doesn't require dist/ during build
  kitchenHandlerPromise ??= new Function(
    'specifier',
    'return import(specifier)',
  )('../dist/kitchen/server/server.mjs') as Promise<SsrModule>;
  return (await kitchenHandlerPromise).reqHandler;
}

async function getHomeHandler() {
  homeHandlerPromise ??= new Function(
    'specifier',
    'return import(specifier)',
  )('../dist/home/server/server.mjs') as Promise<SsrModule>;
  return (await homeHandlerPromise).reqHandler;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const originalUri = req.headers['x-forwarded-uri'] as string | undefined;
  const pathParam = req.query['path'];
  const rawPath = typeof pathParam === 'string' ? pathParam : '';

  const isKitchen = Boolean(originalUri?.startsWith('/kitchen') || rawPath.startsWith('/kitchen'));

  if (isKitchen) {
    if (originalUri?.startsWith('/kitchen')) {
      req.url = originalUri;
    } else if (rawPath) {
      req.url = rawPath;
    } else {
      req.url = '/kitchen/';
    }
  } else {
    req.url = originalUri || rawPath || '/';
  }

  (req as unknown as { originalUrl: string }).originalUrl = req.url;

  try {
    const ssrHandler = isKitchen ? await getKitchenHandler() : await getHomeHandler();
    return await ssrHandler(req, res);
  } catch (err) {
    console.error('SSR Handler Error:', err);
    if (!res.headersSent) {
      return res.status(500).send('Internal Server Error');
    }
  }
}
