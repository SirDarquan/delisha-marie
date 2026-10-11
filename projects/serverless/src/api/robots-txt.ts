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
  };
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

export function getRobotsPrefix(
  req?: VercelRequest,
  sitemaps: string[] = [],
  baseUrl = '',
): string {
  const queryPrefix = (req?.query?.['prefix'] as string | undefined)?.trim();
  if (queryPrefix) {
    return queryPrefix.startsWith('/') ? queryPrefix : `/${queryPrefix}`;
  }
  const envPrefix = (process.env['ROBOTS_PREFIX'] || process.env['SITE_PREFIX'])?.trim();
  if (envPrefix) {
    return envPrefix.startsWith('/') ? envPrefix : `/${envPrefix}`;
  }
  const hasKitchen =
    baseUrl.includes('/kitchen') ||
    Boolean(process.env['SITE_URL']?.includes('/kitchen')) ||
    sitemaps.some((s) => s.includes('/kitchen'));
  return hasKitchen ? '/kitchen' : '';
}

export function buildSitemapUrl(baseUrl: string, sitemap: string, prefix = ''): string {
  if (sitemap.startsWith('http://') || sitemap.startsWith('https://')) {
    return sitemap;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  let cleanSitemap = sitemap.startsWith('/') ? sitemap : `/${sitemap}`;
  const cleanPrefix = prefix ? (prefix.startsWith('/') ? prefix : `/${prefix}`) : '';

  if (cleanPrefix && !cleanBase.endsWith(cleanPrefix) && !cleanSitemap.startsWith(cleanPrefix)) {
    cleanSitemap = `${cleanPrefix}${cleanSitemap}`;
  } else if (cleanBase.endsWith(cleanPrefix) && cleanSitemap.startsWith(cleanPrefix)) {
    cleanSitemap = cleanSitemap.slice(cleanPrefix.length);
  }
  return `${cleanBase}${cleanSitemap}`;
}

export default function robotsTxt(req: VercelRequest, res: VercelResponse): void {
  const baseUrl = getBaseUrl(req);
  const robotsTxt = formatRobotsTxt();
  if (!robotsTxt) {
    res.status(200).end();
    return;
  }

  const sitemaps = Array.isArray(robotsTxt.sitemap)
    ? robotsTxt.sitemap
    : robotsTxt.sitemap
      ? [robotsTxt.sitemap]
      : [];

  const prefix = getRobotsPrefix(req, sitemaps, baseUrl);

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
      robots += `Content-Signal: ${contentSignal.join(', ')}\n`;
    }
    if (rule.disallow) {
      rule.disallow.forEach((disallow) => {
        robots += `Disallow: ${disallow}\n`;
      });
    }
    if (rule.allow) {
      rule.allow.forEach((allow) => {
        robots += `Allow: ${allow}\n`;
      });
    }
    if (rule.crawlDelay) {
      robots += `Crawl-delay: ${rule.crawlDelay}\n`;
    }
  });

  if (robotsTxt.allowLlm) {
    const llmPath = prefix ? `${prefix}/llms.txt` : '/llms.txt';
    robots += `Allow: ${llmPath}\n`;
  }

  if (robotsTxt.sitemap) {
    robots += '\n';
    if (Array.isArray(robotsTxt.sitemap)) {
      robotsTxt.sitemap.forEach((sitemap) => {
        robots += `Sitemap: ${buildSitemapUrl(baseUrl, sitemap, prefix)}\n`;
      });
    } else {
      robots += `Sitemap: ${buildSitemapUrl(baseUrl, robotsTxt.sitemap, prefix)}`;
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
