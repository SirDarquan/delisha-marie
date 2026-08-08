import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import robotsTxtRouter from './robots-txt';

describe('Robots Txt Router API', () => {
  let app: express.Express;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    app = express();
    app.use('/', robotsTxtRouter);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return a 200 and basic robots.txt with empty env', async () => {
    process.env['SITE_URL'] = '';
    delete process.env['ROBOTS_TXT'];

    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.headers['cache-control']).toBe('public, max-age=3600, s-maxage=86400');
    expect(res.text).toContain('# https://www.robotstxt.org/robotstxt.html');
  });

  it('should format userAgent array, allow array, and disallow array', async () => {
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [
        {
          userAgent: ['Googlebot', 'Bingbot'],
          allow: ['/public', '/assets'],
          disallow: ['/private'],
        },
      ],
    });

    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.text).toContain('User-agent: Googlebot\n');
    expect(res.text).toContain('User-agent: Bingbot\n');
    expect(res.text).toContain('Allow: /public\n');
    expect(res.text).toContain('Allow: /assets\n');
    expect(res.text).toContain('Disallow: /private\n');
  });

  it('should format userAgent string, allow array, and disallow array', async () => {
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [
        {
          userAgent: '*',
          allow: ['/'],
          disallow: ['/admin'],
        },
      ],
    });

    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.text).toContain('User-agent: *\n');
    expect(res.text).toContain('Allow: /\n');
    expect(res.text).toContain('Disallow: /admin\n');
  });

  it('should format missing allow and disallow arrays safely', async () => {
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [
        {
          userAgent: '*',
        },
      ],
    });

    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.text).toContain('User-agent: *\n');
    expect(res.text).not.toContain('Allow:');
    expect(res.text).not.toContain('Disallow:');
  });

  it('should append relative sitemap with SITE_URL', async () => {
    process.env['SITE_URL'] = 'https://example.com';
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: '/sitemap.xml',
    });

    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('should append multiple sitemaps when array is provided', async () => {
    process.env['SITE_URL'] = 'https://example.com';
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: ['https://example.com/sitemap1.xml', 'https://example.com/sitemap2.xml'],
    });

    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://example.com/sitemap1.xml');
    expect(res.text).toContain('Sitemap: https://example.com/sitemap2.xml');
  });
});
