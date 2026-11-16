import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { PluginBuild } from 'esbuild';
import defaultRobotsPluginExport, {
  buildRobotsTxtString,
  createRobotsTxtPlugin,
  getBaseUrl,
  loadEnvFiles,
  parseRobotsConfig,
  resolveOutputPath,
} from './robots-txt.plugin';

describe('robots-txt.plugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('parseRobotsConfig', () => {
    it('should return fallback disallow-all when config is undefined or invalid JSON', () => {
      const emptyConfig = parseRobotsConfig();
      expect(emptyConfig.rules).toHaveLength(1);
      expect(emptyConfig.rules[0]).toEqual({ userAgent: '*', disallow: ['/'] });

      const invalidConfig = parseRobotsConfig('not-a-json');
      expect(invalidConfig.rules).toHaveLength(1);
      expect(invalidConfig.rules[0]).toEqual({ userAgent: '*', disallow: ['/'] });
    });

    it('should parse valid JSON correctly', () => {
      const valid = JSON.stringify({
        rules: [{ userAgent: 'Googlebot', allow: ['/'] }],
        sitemap: '/sitemap.xml',
      });
      const parsed = parseRobotsConfig(valid);
      expect(parsed.rules[0].userAgent).toBe('Googlebot');
      expect(parsed.sitemap).toBe('/sitemap.xml');
    });
  });

  describe('getBaseUrl', () => {
    it('should prioritize SITE_URL', () => {
      process.env['SITE_URL'] = 'https://delishamarie.com/';
      expect(getBaseUrl()).toBe('https://delishamarie.com');
    });

    it('should use VERCEL_PROJECT_PRODUCTION_URL in production', () => {
      delete process.env['SITE_URL'];
      process.env['VERCEL_ENV'] = 'production';
      process.env['VERCEL_PROJECT_PRODUCTION_URL'] = 'delishamarie.vercel.app';
      expect(getBaseUrl()).toBe('https://delishamarie.vercel.app');
    });

    it('should use VERCEL_URL in preview', () => {
      delete process.env['SITE_URL'];
      process.env['VERCEL_ENV'] = 'preview';
      process.env['VERCEL_URL'] = 'delisha-preview.vercel.app';
      expect(getBaseUrl()).toBe('https://delisha-preview.vercel.app');
    });

    it('should fallback to localhost if no env vars present', () => {
      delete process.env['SITE_URL'];
      delete process.env['VERCEL_ENV'];
      delete process.env['VERCEL_URL'];
      delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
      expect(getBaseUrl()).toBe('https://localhost');
    });
  });

  describe('buildRobotsTxtString', () => {
    it('should format single rule with disallow, allow, and crawlDelay', () => {
      const robots = buildRobotsTxtString({
        rules: [
          {
            userAgent: 'Baiduspider',
            allow: ['/public'],
            disallow: ['/admin'],
            crawlDelay: 5,
          },
        ],
      });

      expect(robots).toContain('User-agent: Baiduspider\n');
      expect(robots).toContain('Allow: /public\n');
      expect(robots).toContain('Disallow: /admin\n');
      expect(robots).toContain('Crawl-delay: 5\n');
    });

    it('should format contentSignal metadata', () => {
      const robots = buildRobotsTxtString({
        rules: [
          {
            userAgent: '*',
            contentSignal: {
              search: 'yes',
              aiInput: 'yes',
              aiTrain: 'no',
              use: 'reference',
            },
          },
        ],
      });

      expect(robots).toContain(
        'Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference\n',
      );
    });

    it('should append allowLlm rule and sitemap array', () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      const robots = buildRobotsTxtString(
        {
          rules: [{ userAgent: '*' }],
          allowLlm: true,
          sitemap: ['/sitemap.xml', '/sitemap-recipes.xml'],
        },
        '/kitchen',
      );

      expect(robots).toContain('Allow: /kitchen/llms.txt\n');
      expect(robots).toContain('Sitemap: https://delishamarie.com/kitchen/sitemap.xml\n');
      expect(robots).toContain('Sitemap: https://delishamarie.com/kitchen/sitemap-recipes.xml\n');
    });
  });

  describe('createRobotsTxtPlugin', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'robots-test-'));
    });

    afterEach(async () => {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    });

    it('should register onEnd hook and write robots.txt to output directory', async () => {
      process.env['ROBOTS_TXT'] = JSON.stringify({
        rules: [{ userAgent: '*', allow: ['/'] }],
        sitemap: '/sitemap.xml',
      });
      process.env['SITE_URL'] = 'https://example.com';

      const plugin = createRobotsTxtPlugin({ outputPath: tmpDir });
      expect(plugin.name).toBe('generate-robots-txt');

      let onEndCallback: ((result: { errors: unknown[] }) => Promise<void>) | undefined;
      const buildMock: Partial<PluginBuild> = {
        initialOptions: {},
        onEnd: (callback) => {
          onEndCallback = callback as (result: { errors: unknown[] }) => Promise<void>;
        },
      };

      plugin.setup(buildMock as PluginBuild);
      expect(onEndCallback).toBeDefined();

      await onEndCallback!({ errors: [] });

      const generatedFile = path.join(tmpDir, 'robots.txt');
      expect(fs.existsSync(generatedFile)).toBe(true);

      const content = await fs.promises.readFile(generatedFile, 'utf8');
      expect(content).toContain('User-agent: *\n');
      expect(content).toContain('Allow: /\n');
      expect(content).toContain('Sitemap: https://example.com/sitemap.xml\n');
    });

    it('should not write file if build result has errors', async () => {
      const plugin = createRobotsTxtPlugin({ outputPath: tmpDir });

      let onEndCallback: ((result: { errors: unknown[] }) => Promise<void>) | undefined;
      const buildMock: Partial<PluginBuild> = {
        initialOptions: {},
        onEnd: (callback) => {
          onEndCallback = callback as (result: { errors: unknown[] }) => Promise<void>;
        },
      };

      plugin.setup(buildMock as PluginBuild);
      await onEndCallback!({ errors: [{ text: 'Build failed' }] });

      const generatedFile = path.join(tmpDir, 'robots.txt');
      expect(fs.existsSync(generatedFile)).toBe(false);
    });

    it('should support default export factory function and all overload variants', () => {
      const pluginWithOptions = defaultRobotsPluginExport({ outputPath: tmpDir });
      expect(pluginWithOptions.name).toBe('generate-robots-txt');

      const pluginWithAngularOptions = defaultRobotsPluginExport({
        outputPath: { base: 'dist', browser: '' },
      } as any);
      expect(pluginWithAngularOptions.name).toBe('generate-robots-txt');

      const pluginWithBoth = defaultRobotsPluginExport(
        { envKey: 'MY_ROBOTS' },
        { outputPath: { base: tmpDir, browser: 'browser' } },
      );
      expect(pluginWithBoth.name).toBe('generate-robots-txt');
    });

    it('should resolve various outputPath formats in resolveOutputPath', () => {
      expect(resolveOutputPath('dist/custom')).toBe('dist/custom');
      expect(resolveOutputPath({ base: 'dist', browser: 'browser' })).toBe(
        path.join('dist', 'browser'),
      );
      expect(resolveOutputPath({ base: 'dist' })).toBe('dist');
      expect(resolveOutputPath(undefined)).toBeUndefined();
    });

    it('should fallback to builderOptions and initialOptions when outputPath is unset', async () => {
      const plugin = createRobotsTxtPlugin(
        undefined,
        { outputPath: { base: tmpDir, browser: 'public' } },
      );

      let onEndCallback: ((result: { errors: unknown[]; outputFiles?: unknown[] }) => Promise<void>) | undefined;
      const buildMock: Partial<PluginBuild> = {
        initialOptions: { outdir: tmpDir },
        onEnd: (callback) => {
          onEndCallback = callback as any;
        },
      };

      plugin.setup(buildMock as PluginBuild);
      const mockResult: { errors: unknown[]; outputFiles: any[] } = {
        errors: [],
        outputFiles: [],
      };
      await onEndCallback!(mockResult);

      expect(mockResult.outputFiles.length).toBe(1);
      expect(mockResult.outputFiles[0].path).toBe('robots.txt');
      expect(fs.existsSync(path.join(tmpDir, 'public', 'robots.txt'))).toBe(true);
    });

    it('should fallback to initialOptions.outdir or dist default if builderOptions is undefined', async () => {
      const plugin = createRobotsTxtPlugin();

      let onEndCallback: ((result: { errors: unknown[]; outputFiles?: unknown[] }) => Promise<void>) | undefined;
      const buildMock: Partial<PluginBuild> = {
        initialOptions: { outdir: tmpDir },
        onEnd: (callback) => {
          onEndCallback = callback as any;
        },
      };

      plugin.setup(buildMock as PluginBuild);
      await onEndCallback!({ errors: [] });
      expect(fs.existsSync(path.join(tmpDir, 'robots.txt'))).toBe(true);
    });

    it('should format multiple userAgent array and single sitemap string', () => {
      process.env['SITE_URL'] = 'https://example.com';
      const robots = buildRobotsTxtString({
        rules: [
          {
            userAgent: ['Googlebot', 'Bingbot'],
            allow: ['/public'],
            disallow: ['/private'],
          },
        ],
        sitemap: '/sitemap.xml',
      });

      expect(robots).toContain('User-agent: Googlebot\n');
      expect(robots).toContain('User-agent: Bingbot\n');
      expect(robots).toContain('Sitemap: https://example.com/sitemap.xml\n');
    });

    it('should test loadEnvFiles with existing env files and edge cases', () => {
      const testEnvDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
      const prevCwd = process.cwd();
      try {
        process.chdir(testEnvDir);
        fs.writeFileSync(
          '.env.local',
          '# Comment line\n\nROBOTS_TEST_VAR="hello"\nROBOTS_TEST_SINGLE=\x27world\x27\nROBOTS_TEST_RAW=plain\nINVALID_LINE_NO_EQUALS\n',
        );
        delete process.env['ROBOTS_TEST_VAR'];
        delete process.env['ROBOTS_TEST_SINGLE'];
        delete process.env['ROBOTS_TEST_RAW'];

        loadEnvFiles();
        expect(process.env['ROBOTS_TEST_VAR']).toBe('hello');
        expect(process.env['ROBOTS_TEST_SINGLE']).toBe('world');
        expect(process.env['ROBOTS_TEST_RAW']).toBe('plain');

        // Test already set variable is not overwritten
        process.env['ROBOTS_TEST_VAR'] = 'existing';
        loadEnvFiles();
        expect(process.env['ROBOTS_TEST_VAR']).toBe('existing');
      } finally {
        process.chdir(prevCwd);
        fs.rmSync(testEnvDir, { recursive: true, force: true });
        delete process.env['ROBOTS_TEST_VAR'];
        delete process.env['ROBOTS_TEST_SINGLE'];
        delete process.env['ROBOTS_TEST_RAW'];
      }
    });

    it('should handle unreadable file or parse error gracefully in loadEnvFiles', () => {
      const testEnvDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-unreadable-'));
      const prevCwd = process.cwd();
      try {
        process.chdir(testEnvDir);
        const envFile = path.join(testEnvDir, '.env.local');
        fs.writeFileSync(envFile, 'SECRET=val');
        try {
          fs.chmodSync(envFile, 0o000);
        } catch {
          // Some filesystems might ignore chmod, continue anyway
        }

        expect(() => loadEnvFiles()).not.toThrow();
      } finally {
        try {
          fs.chmodSync(path.join(testEnvDir, '.env.local'), 0o666);
        } catch {
          // ignore
        }
        process.chdir(prevCwd);
        fs.rmSync(testEnvDir, { recursive: true, force: true });
      }
    });

    it('should format contentSignal with all permutations', () => {
      const robots = buildRobotsTxtString({
        rules: [
          {
            userAgent: '*',
            contentSignal: {
              search: 'yes',
              aiInput: 'no',
              aiTrain: 'no',
              use: 'full',
            },
            crawlDelay: 5,
          },
        ],
      });
      expect(robots).toContain('Content-Signal: search=yes, ai-input=no, ai-train=no, use=full\n');
      expect(robots).toContain('Crawl-delay: 5\n');
    });

    it('should handle resolveOutputPath with falsy and object combinations', () => {
      expect(resolveOutputPath(undefined)).toBeUndefined();
      expect(resolveOutputPath('')).toBe('');
      expect(resolveOutputPath({ base: 'dist' })).toBe('dist');
      expect(resolveOutputPath({ base: '', browser: 'browser' })).toBe('browser');
    });
  });
});
