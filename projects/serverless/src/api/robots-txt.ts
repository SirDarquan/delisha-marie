import { VercelRequest, VercelResponse } from '@vercel/node';

interface Rule {
  userAgent: string | string[];
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  contentSignal?: {
    search?: string;
    aiInput?: string;
    aiTrain?: string;
    use?: 'immedate' | 'reference' | 'full';
  };
  prefix?: boolean;
}

interface RobotsTxt {
  rules: Rule[];
  allowLlm?: boolean;
  sitemap?: string | string[];
}

function getBaseUrl(req: VercelRequest): string {
  let base: string;
  const vercelEnv = process.env['VERCEL_ENV'];
  if (process.env['SITE_URL']) {
    base = process.env['SITE_URL'];
  } else if (vercelEnv === 'preview') {
    base = `https://${process.env['VERCEL_URL']}`;
  } else if (vercelEnv === 'production') {
    base = `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`;
  } else {
    const proto = req.headers?.['x-forwarded-proto'] || 'https';
    const host = req.headers?.['host'] || 'localhost';
    base = `${proto}://${host}`;
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function formatRobotsTxt(): RobotsTxt {
  try {
    return JSON.parse(process.env['ROBOTS_TXT'] || '') as RobotsTxt;
  } catch {
    return JSON.parse('{"rules":[{"userAgent":"*","disallow":["/"]}]}') as RobotsTxt;
  }
}

export function getRobotsPrefix(req?: VercelRequest): string {
  const queryPrefix = (req?.query?.['prefix'] as string | undefined)?.trim();
  if (queryPrefix) {
    return queryPrefix.startsWith('/') ? queryPrefix : `/${queryPrefix}`;
  }
  return '';
}

export default function robotsTxt(req: VercelRequest, res: VercelResponse): void {
  const baseUrl = getBaseUrl(req);
  const robotsTxt = formatRobotsTxt();
  if (!robotsTxt) {
    res.status(200).end();
    return;
  }

  const prefix = getRobotsPrefix(req);

  let robots = '# https://www.robotstxt.org/robotstxt.html\n';

  robotsTxt.rules?.forEach((rule) => {
    robots += '\n';
    if (Array.isArray(rule.userAgent)) {
      rule.userAgent.forEach((userAgent) => {
        robots += `User-agent: ${userAgent}\n`;
      });
    } else {
      robots += `User-agent: ${rule.userAgent}\n`;
    }
    if (rule.contentSignal) {
      const contentSignal = [];
      if (rule.contentSignal.search) {
        contentSignal.push(`search=${rule.contentSignal.search}`);
      }
      if (rule.contentSignal.aiInput) {
        contentSignal.push(`ai-input=${rule.contentSignal.aiInput}`);
      }
      if (rule.contentSignal.aiTrain) {
        contentSignal.push(`ai-train=${rule.contentSignal.aiTrain}`);
      }
      if (rule.contentSignal.use) {
        contentSignal.push(`use=${rule.contentSignal.use}`);
      }
      robots += `Content-Signal: ${contentSignal.join(', ')}\n`;
    }
    if (rule.disallow) {
      rule.disallow.forEach((disallow) => {
        robots += `Disallow: ${rule.prefix ? prefix : ''}${disallow}\n`;
      });
    }
    if (rule.allow) {
      rule.allow.forEach((allow) => {
        robots += `Allow: ${rule.prefix ? prefix : ''}${allow}\n`;
      });
    }
    if (rule.crawlDelay) {
      robots += `Crawl-delay: ${rule.crawlDelay}\n`;
    }
  });

  if (robotsTxt.allowLlm) {
    robots += `Allow: ${prefix}/llms.txt\n`;
  }

  if (robotsTxt.sitemap) {
    robots += '\n';
    if (Array.isArray(robotsTxt.sitemap)) {
      robotsTxt.sitemap.forEach((sitemap) => {
        robots += `Sitemap: ${baseUrl}${prefix}${sitemap}\n`;
      });
    } else {
      robots += `Sitemap: ${baseUrl}${prefix}${robotsTxt.sitemap}\n`;
    }
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  const isDev = !process.env['VERCEL_ENV'] && !process.env['SITE_URL'];
  res.setHeader(
    'Cache-Control',
    isDev ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600, s-maxage=86400',
  );
  res.status(200).send(robots);
}
