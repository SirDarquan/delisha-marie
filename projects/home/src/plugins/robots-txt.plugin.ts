import type { Plugin, PluginBuild } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface Rule {
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

export interface RobotsTxtConfig {
  rules: Rule[];
  allowLlm?: boolean;
  sitemap?: string | string[];
}

export interface RobotsTxtPluginOptions {
  outputPath?: string;
  envKey?: string;
  prefix?: string;
}

const ENV_LINE_REGEX = /^([^=]+)=(.*)$/;

function parseEnvValue(rawVal: string): string {
  const trimmed = rawVal.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvLine(line: string): void {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;

  const match = ENV_LINE_REGEX.exec(trimmed);
  if (!match) return;

  const key = match[1].trim();
  if (!process.env[key]) {
    process.env[key] = parseEnvValue(match[2]);
  }
}

function loadEnvFile(envPath: string): void {
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(parseEnvLine);
  } catch {
    // Ignore unreadable env files
  }
}

export function loadEnvFiles(): void {
  const envPaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'projects/home/.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];
  envPaths.forEach(loadEnvFile);
}

export function parseRobotsConfig(rawConfig?: string): RobotsTxtConfig {
  try {
    return JSON.parse(rawConfig || '') as RobotsTxtConfig;
  } catch {
    return {
      rules: [{ userAgent: '*', disallow: ['/'] }],
    };
  }
}

export function getBaseUrl(): string {
  const vercelEnv = process.env['VERCEL_ENV'];
  let base: string;
  if (process.env['SITE_URL']) {
    base = process.env['SITE_URL'];
  } else if (vercelEnv === 'preview' && process.env['VERCEL_URL']) {
    base = `https://${process.env['VERCEL_URL']}`;
  } else if (vercelEnv === 'production' && process.env['VERCEL_PROJECT_PRODUCTION_URL']) {
    base = `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`;
  } else {
    base = 'https://localhost';
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function buildRobotsTxtString(config: RobotsTxtConfig, prefix = ''): string {
  const baseUrl = getBaseUrl();
  let robots = '# https://www.robotstxt.org/robotstxt.html\n';

  config.rules?.forEach((rule) => {
    robots += '\n';
    if (Array.isArray(rule.userAgent)) {
      rule.userAgent.forEach((userAgent) => {
        robots += `User-agent: ${userAgent}\n`;
      });
    } else {
      robots += `User-agent: ${rule.userAgent}\n`;
    }

    if (rule.contentSignal) {
      const contentSignal: string[] = [];
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

  if (config.allowLlm) {
    robots += `Allow: ${prefix}/llms.txt\n`;
  }

  if (config.sitemap) {
    robots += '\n';
    if (Array.isArray(config.sitemap)) {
      config.sitemap.forEach((sitemap) => {
        robots += `Sitemap: ${baseUrl}${prefix}${sitemap}\n`;
      });
    } else {
      robots += `Sitemap: ${baseUrl}${prefix}${config.sitemap}\n`;
    }
  }

  return robots;
}

export function resolveOutputPath(
  outputPath?: string | { base?: string; browser?: string },
): string | undefined {
  if (typeof outputPath === 'string') {
    return outputPath;
  }
  if (outputPath && typeof outputPath === 'object') {
    return outputPath.browser
      ? path.join(outputPath.base || '', outputPath.browser)
      : outputPath.base;
  }
  return undefined;
}

export function createRobotsTxtPlugin(
  pluginOptions?: RobotsTxtPluginOptions,
  builderOptions?: { outputPath?: string | { base?: string; browser?: string } },
): Plugin {
  return {
    name: 'generate-robots-txt',
    setup(build: PluginBuild) {
      build.onEnd(async (result) => {
        if (result.errors && result.errors.length > 0) {
          return;
        }

        // Determine output directory:
        // 1. Explicitly configured pluginOptions.outputPath
        // 2. Angular builderOptions.outputPath (string or { base, browser })
        // 3. esbuild initialOptions.outdir
        let outdir = resolveOutputPath(pluginOptions?.outputPath);
        if (!outdir) {
          outdir = resolveOutputPath(builderOptions?.outputPath);
        }
        if (!outdir) {
          outdir = resolveOutputPath(build.initialOptions.outdir);
        }
        if (!outdir) {
          outdir = 'dist';
        }

        loadEnvFiles();
        const envKey = pluginOptions?.envKey || 'ROBOTS_TXT';
        const rawConfig = process.env[envKey];
        const config = parseRobotsConfig(rawConfig);
        const robotsContent = buildRobotsTxtString(config, pluginOptions?.prefix || '');

        // In Angular CLI esbuild bundler:
        // result.outputFiles entries must use the filename/relative path (e.g. 'robots.txt')
        // which Angular CLI then places into outputOptions.base/outputOptions.browser ('dist/robots.txt').
        if (result.outputFiles) {
          const contents = Buffer.from(robotsContent, 'utf8');
          result.outputFiles.push({
            path: 'robots.txt',
            contents,
            hash: '',
            text: robotsContent,
          });
        }

        // Also ensure direct disk write (for standalone execution or custom outdir):
        const diskFilePath = path.join(outdir, 'robots.txt');
        await fs.promises.mkdir(outdir, { recursive: true });
        await fs.promises.writeFile(diskFilePath, robotsContent, 'utf8');
      });
    },
  };
}

export default function robotsTxtPluginFactory(
  firstArg?: RobotsTxtPluginOptions | { outputPath?: string | { base?: string; browser?: string } },
  secondArg?: { outputPath?: string | { base?: string; browser?: string } },
): Plugin {
  // When configured as a string in angular.json: loadPlugins calls factory(builderOptions, target)
  // When configured with options: loadPlugins calls factory(options, builderOptions, target)
  if (firstArg && 'outputPath' in firstArg && typeof firstArg.outputPath === 'object') {
    return createRobotsTxtPlugin(undefined, firstArg);
  }
  return createRobotsTxtPlugin(firstArg as RobotsTxtPluginOptions | undefined, secondArg);
}
