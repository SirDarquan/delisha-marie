import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import robotsPlugin from './robots.plugin';

vi.mock('node:fs', () => {
  return {
    writeFileSync: vi.fn(),
  };
});

describe('robotsPlugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create a plugin object with name and setup', () => {
    const plugin = robotsPlugin({});
    expect(plugin.name).toBe('robots-plugin');
    expect(typeof plugin.setup).toBe('function');
  });

  it('should generate basic robots.txt with default user agent on onStart', () => {
    const plugin = robotsPlugin({});
    
    let onStartCallback: Function | undefined;
    const buildMock: any = {
      onStart: (callback: Function) => {
        onStartCallback = callback;
      }
    };
    
    plugin.setup(buildMock);
    expect(onStartCallback).toBeDefined();
    
    onStartCallback!();

    expect(fs.writeFileSync).toHaveBeenCalled();
    const [outPath, content] = vi.mocked(fs.writeFileSync).mock.calls[0];
    
    expect(outPath).toContain('robots.txt');
    expect(content as string).toContain('User-agent: *');
  });

  it('should include allow, disallow, and sitemap when provided', () => {
    process.env['SITE_URL'] = 'https://example.com';
    
    const plugin = robotsPlugin({
      userAgent: 'Googlebot',
      allow: ['/public'],
      disallow: ['/private', '/admin']
    });
    
    let onStartCallback: Function | undefined;
    const buildMock: any = {
      onStart: (callback: Function) => {
        onStartCallback = callback;
      }
    };
    
    plugin.setup(buildMock);
    onStartCallback!();

    const [_, content] = vi.mocked(fs.writeFileSync).mock.calls[0];
    
    expect(content as string).toContain('User-agent: Googlebot');
    expect(content as string).toContain('Allow: /public');
    expect(content as string).toContain('Disallow: /private');
    expect(content as string).toContain('Disallow: /admin');
    expect(content as string).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('should catch and log errors if writeFileSync throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fs.writeFileSync).mockImplementationOnce(() => {
      throw new Error('Write error');
    });

    const plugin = robotsPlugin({});
    let onStartCallback: Function | undefined;
    const buildMock: any = {
      onStart: (callback: Function) => {
        onStartCallback = callback;
      }
    };
    
    plugin.setup(buildMock);
    onStartCallback!();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to generate robots.txt:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
