import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { findSourceMap } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

function buildDirectoryChain(start: string, target: string): string[] {
  const relative = path.relative(start, target);
  const isSubdir = !relative.startsWith('..') && !path.isAbsolute(relative);
  if (!isSubdir) {
    return [start, target];
  }

  const chain: string[] = [start];
  let current = start;
  const parts = relative.split(path.sep).filter(Boolean);
  for (const part of parts) {
    current = path.join(current, part);
    chain.push(current);
  }
  return chain;
}

function parseAndLoadEnvFile(envPath: string): void {
  if (!fs.existsSync(envPath)) return;

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

export function loadCascadingEnvs(startDir: string, targetDir: string, fileName = '.env'): void {
  const start = path.resolve(startDir);
  const target = path.resolve(targetDir);
  const chain = buildDirectoryChain(start, target);

  // Iterate backwards from deepest to shallowest
  for (const dir of chain.slice().reverse()) {
    parseAndLoadEnvFile(path.join(dir, fileName));
  }
}

function resolveMappedPath(sources: string[], target: string): string | null {
  const normalizedTarget = path.normalize(target);
  for (const source of sources) {
    const origin = source.startsWith('file://') ? fileURLToPath(source) : source;
    const normalizedOrigin = path.normalize(origin);
    if (normalizedOrigin.includes(normalizedTarget)) {
      if (fs.existsSync(normalizedOrigin)) {
        return path.dirname(normalizedOrigin);
      }
    }
  }
  return null;
}

/**
 * Dynamically discovers the absolute directory of the source file.
 * Leverages the native Node.js findSourceMap API to resolve the runtime
 * bundle back to its origin physical path on disk, without fake errors.
 */
export function getSourceDir(targetSourcePath: string): string {
  const currentDir = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url));
  const currentFile = import.meta.filename || fileURLToPath(import.meta.url);

  try {
    const map = findSourceMap(currentFile);
    const sources = map?.payload?.sources;
    if (Array.isArray(sources)) {
      return resolveMappedPath(sources, targetSourcePath) || currentDir;
    }
  } catch {
    // Silent fallback for non-mapped runtimes
  }

  return currentDir;
}
