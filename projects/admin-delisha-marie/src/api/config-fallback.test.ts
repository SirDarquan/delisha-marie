import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import { findSourceMap } from 'node:module';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('node:module', () => ({
  findSourceMap: vi.fn(),
}));

describe('Config Router Service - Fallback Initialization Lifecycle', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: typeof process.cwd;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    originalCwd = process.cwd;

    // Setup robust spy interceptors on fs methods
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('');

    // Default findSourceMap to return undefined, avoiding any casts
    vi.mocked(findSourceMap).mockReturnValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
    vi.restoreAllMocks();
  });

  it('should fall back to empty string if DESCOPE_PROJECT_ID is missing', async () => {
    delete process.env['DESCOPE_PROJECT_ID'];

    const { default: configRouter } = await import('./config');
    const app = express().use(configRouter);

    const res = await request(app).get('/config');
    expect(res.body.DescopeProjectId).toBe('');
  });
});
