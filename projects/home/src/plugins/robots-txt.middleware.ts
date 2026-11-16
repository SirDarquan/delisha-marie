import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildRobotsTxtString, loadEnvFiles, parseRobotsConfig } from '../plugins/robots-txt.plugin';

export default function robotsTxtMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  const url = req.url?.split('?')[0];
  if (url === '/robots.txt') {
    loadEnvFiles();
    const rawConfig = process.env['ROBOTS_TXT'];
    const config = parseRobotsConfig(rawConfig);
    const content = buildRobotsTxtString(config);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.end(content);
    return;
  }

  next();
}
