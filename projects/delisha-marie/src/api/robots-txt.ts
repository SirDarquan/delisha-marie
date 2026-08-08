import { Request, Response, Router } from 'express';
const robotsTxt = Router();

interface Rule {
  userAgent: string | string[];
  allow?: string[];
  disallow?: string[];
}

interface RobotsTxt {
  rules: Rule[];
  sitemap?: string | string[];
}

robotsTxt.get('/robots.txt', (_req: Request, res: Response): void => {
  const baseUrl = process.env['SITE_URL'] || '';
  const robotsTxt: RobotsTxt = JSON.parse(process.env['ROBOTS_TXT'] || '{}');
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
        robots += `Sitemap: ${sitemap}`;
      });
    } else {
      robots += `Sitemap: ${baseUrl}${robotsTxt.sitemap}`;
    }
  }

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.send(robots);
});

export default robotsTxt;
