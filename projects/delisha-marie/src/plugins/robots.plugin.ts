import type { Plugin, PluginBuild } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface RobotsTxtOptions {
  userAgent?: string;
  allow?: string[];
  disallow?: string[];
}

function robotsPlugin(options: RobotsTxtOptions): Plugin {
  return {
    name: 'robots-plugin',
    setup(build: PluginBuild) {
      build.onStart(() => {
        let content = `# https://www.robotstxt.org/robotstxt.html\n\n`;
        content += `User-agent: ${options.userAgent ?? '*'}\n`;
        options.allow?.forEach((path) => {
          content += `Allow: ${path}\n`;
        });
        content += `\n`;
        options.disallow?.forEach((path) => {
          content += `Disallow: ${path}\n`;
        });

        if (process.env['SITE_URL']) {
          content += `\nSitemap: ${process.env['SITE_URL']}/sitemap.xml\n`;
        }

        const outpath = path.join(process.cwd(), 'projects/delisha-marie/public/robots.txt');

        try {
          fs.writeFileSync(outpath, content);
        } catch (e) {
          console.error('Failed to generate robots.txt:', e);
        }
      });
    },
  };
}

export default robotsPlugin;
