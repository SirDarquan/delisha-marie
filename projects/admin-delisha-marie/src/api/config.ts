import { Router, Request, Response } from 'express';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { findSourceMap } from 'node:module';
import fs from 'fs';
import path from 'path';

function loadCascadingEnvs(startDir: string, targetDir: string, fileName = '.env') {
  const start = path.resolve(startDir);
  const target = path.resolve(targetDir);

  const chain: string[] = [start];
  const relative = path.relative(start, target);

  // If target is a subdirectory of start, expand the chain downwards
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
    let current = start;
    const parts = relative.split(path.sep).filter(Boolean);
    for (const part of parts) {
      current = path.join(current, part);
      chain.push(current);
    }
  } else {
    // If they are disjoint, just load start and then target
    chain.push(target);
  }

  // Iterate backwards from deepest to shallowest, only assigning keys if not present.
  // This respects existing shell/test environment vars while properly cascading files.
  for (const dir of chain.slice().reverse()) {
    const envPath = path.join(dir, fileName);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const parsed = parseEnv(content);
        for (const [key, value] of Object.entries(parsed)) {
          if (!(key in process.env)) {
            process.env[key] = value;
          }
        }
      } catch {
        console.error(`❌ Error parsing env file at ${envPath}`);
      }
    }
  }
}
/**
 * Dynamically discovers the absolute directory of the source file.
 * Leverages the native Node.js findSourceMap API to resolve the runtime
 * bundle back to its origin physical path on disk, without fake errors.
 */
function getSourceDir(targetSourcePath: string): string {
  // In Node 21+, import.meta.dirname exists natively
  const currentDir = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url));
  const currentFile = import.meta.filename || fileURLToPath(import.meta.url);

  try {
    const map = findSourceMap(currentFile);
    if (map?.payload?.sources && Array.isArray(map.payload.sources)) {
      for (const source of map.payload.sources) {
        if (source.includes(targetSourcePath)) {
          const originPath = source.startsWith('file://') ? fileURLToPath(source) : source;
          if (fs.existsSync(originPath)) {
            return path.dirname(originPath);
          }
        }
      }
    }
  } catch {
    // Silent fallback for non-mapped runtimes
  }

  return currentDir;
}

// Dynamically resolve and execute cascaded loading
loadCascadingEnvs(process.cwd(), getSourceDir('/api/config.ts'));

const configRouter = Router();

export interface AppConfig {
  SocialClients: {
    GoogleClientId?: string;
    AmazonClientId?: string;
    FacebookClientId?: string;
    VKClientId?: string;
    MicrosoftClientId?: string;
  };
}

const appConfig: AppConfig = {
  SocialClients: {
    GoogleClientId: process.env['GOOGLE_CLIENT_ID'],
  },
};

configRouter.get('/config', (req: Request, res: Response) => {
  res.json(appConfig);
});

export default configRouter;
