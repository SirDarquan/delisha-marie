import path from 'node:path';
import { pathToFileURL } from 'node:url';

const serverDistPath = path.join(process.cwd(), 'dist/delisha-marie/server/server.mjs');
const serverDistUrl = pathToFileURL(serverDistPath).href;

export default async function handler(req, res) {
  try {
    // Dynamically import the Angular SSR server using a valid file:// URL for cross-platform compatibility
    const module = await import(serverDistUrl);
    
    // Angular 17+ SSR exports 'reqHandler' by default, but fallback to 'app' just in case
    const ssrHandler = module.reqHandler || module.app || module.default;
    
    if (!ssrHandler) {
      res.status(500).send('Could not find Angular SSR handler (reqHandler or app) in server.mjs');
      return;
    }
    
    return ssrHandler(req, res);
  } catch (err) {
    console.error('Error loading SSR module:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
}