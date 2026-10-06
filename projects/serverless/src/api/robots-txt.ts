import { VercelRequest, VercelResponse } from '@vercel/node';

interface Rule {
  userAgent: string | string[];
  allow?: string[];
  disallow?: string[];
}

interface RobotsTxt {
  rules: Rule[];
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

export default function robotsTxt(req: VercelRequest, res: VercelResponse): void {
  const baseUrl = getBaseUrl(req);
  const robotsTxt: RobotsTxt = JSON.parse(
    process.env['ROBOTS_TXT'] || '{"rules":[{"userAgent":"*","disallow":["/"]}]}',
  );
  let robots = '# https://www.robotstxt.org/robotstxt.html\n';

  robotsTxt.rules?.forEach((rule) => {
    if (Array.isArray(rule.userAgent)) {
      rule.userAgent.forEach((userAgent) => {
        robots += `User-agent: ${userAgent}\n`;
      });
    } else {
      robots += `User-agent: ${rule.userAgent}\n`;
    }
    if (rule.allow) {
      rule.allow.forEach((allow) => {
        robots += `Allow: ${allow}\n`;
      });
    }
    if (rule.disallow) {
      rule.disallow.forEach((disallow) => {
        robots += `Disallow: ${disallow}\n`;
      });
    }
    robots += '\n';
  });

  if (robotsTxt.sitemap) {
    if (Array.isArray(robotsTxt.sitemap)) {
      robotsTxt.sitemap.forEach((sitemap) => {
        const url = sitemap.startsWith('http') ? sitemap : `${baseUrl}${sitemap}`;
        robots += `Sitemap: ${url}\n`;
      });
    } else {
      const sitemap = robotsTxt.sitemap;
      const url = sitemap.startsWith('http') ? sitemap : `${baseUrl}${sitemap}`;
      robots += `Sitemap: ${url}`;
    }
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(robots);
}
