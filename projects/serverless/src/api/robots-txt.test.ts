import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRequestMock } from './test-utils';
import robotsTxtRouter from './robots-txt';

describe('robotsTxtRouter', () => {
  let request: ReturnType<typeof createRequestMock>;
  const app = null;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    request = createRequestMock(robotsTxtRouter);
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

  it('should use VERCEL_PROJECT_PRODUCTION_URL in production if SITE_URL is not set', async () => {
    delete process.env['SITE_URL'];
    process.env['VERCEL_ENV'] = 'production';
    process.env['VERCEL_PROJECT_PRODUCTION_URL'] = 'vercel-test.com';
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: '/sitemap.xml',
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://vercel-test.com/sitemap.xml');
  });

  it('should use VERCEL_URL in preview if SITE_URL is not set', async () => {
    delete process.env['SITE_URL'];
    process.env['VERCEL_ENV'] = 'preview';
    process.env['VERCEL_URL'] = 'preview-test.vercel.app';
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: '/sitemap.xml',
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://preview-test.vercel.app/sitemap.xml');
  });

  it('should fallback to headers/localhost when no env vars are set', async () => {
    delete process.env['SITE_URL'];
    delete process.env['VERCEL_ENV'];
    delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
    delete process.env['VERCEL_URL'];
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: '/sitemap.xml',
    });
    const res = await request(app)
      .get('/robots.txt')
      .set('x-forwarded-proto', 'https')
      .set('host', 'custom-host:4200');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://custom-host:4200/sitemap.xml');
  });

  it('should trim trailing slash from SITE_URL', async () => {
    process.env['SITE_URL'] = 'https://example.com/';
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: '/sitemap.xml',
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('should fallback to default https and localhost when request headers are empty', async () => {
    delete process.env['SITE_URL'];
    delete process.env['VERCEL_ENV'];
    delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
    delete process.env['VERCEL_URL'];
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: '/sitemap.xml',
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://localhost/sitemap.xml');
  });

  it('should return empty 200 when robotsTxt parses to null', async () => {
    process.env['ROBOTS_TXT'] = 'null';
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toBeUndefined();
  });

  it('should format contentSignal and crawlDelay completely', async () => {
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [
        {
          userAgent: ['Bot1'],
          contentSignal: {
            search: 'yes',
            aiInput: 'no',
            aiTrain: 'no',
          },
          crawlDelay: 10,
        },
      ],
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Content-Signal: search=yes, ai-input=no, ai-train=no\n');
    expect(res.text).toContain('Crawl-delay: 10\n');
  });

  it('should format contentSignal partial fields', async () => {
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [
        {
          userAgent: 'Bot2',
          contentSignal: {
            search: 'no',
          },
        },
        {
          userAgent: 'Bot3',
          contentSignal: {
            aiInput: 'yes',
          },
        },
        {
          userAgent: 'Bot4',
          contentSignal: {
            aiTrain: 'yes',
          },
        },
        {
          userAgent: 'Bot5',
          contentSignal: {},
        },
      ],
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Content-Signal: search=no\n');
    expect(res.text).toContain('Content-Signal: ai-input=yes\n');
    expect(res.text).toContain('Content-Signal: ai-train=yes\n');
    expect(res.text).toContain('User-agent: Bot5\nContent-Signal: \n');
  });

  it('should handle array sitemaps with both relative and absolute urls', async () => {
    process.env['SITE_URL'] = 'https://example.com';
    process.env['ROBOTS_TXT'] = JSON.stringify({
      rules: [],
      sitemap: ['/relative-sitemap.xml', 'https://example.com/absolute-sitemap.xml'],
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://example.com/relative-sitemap.xml\n');
    expect(res.text).toContain('Sitemap: https://example.com/absolute-sitemap.xml\n');
  });

  it('should handle single string absolute sitemap and missing rules property', async () => {
    process.env['SITE_URL'] = 'https://example.com';
    process.env['ROBOTS_TXT'] = JSON.stringify({
      sitemap: 'https://example.com/sitemap.xml',
    });
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sitemap: https://example.com/sitemap.xml');
  });
});
