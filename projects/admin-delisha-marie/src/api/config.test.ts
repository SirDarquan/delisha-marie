import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import { findSourceMap } from 'node:module';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('node:module', () => ({
  findSourceMap: vi.fn(),
}));

describe('Config Router Service - Self-Initialization Lifecycle', () => {
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

  it('should load and present base configuration normally', async () => {
    process.env['GOOGLE_CLIENT_ID'] = 'base-id';
    process.env['DESCOPE_PROJECT_ID'] = 'test-descope-id';

    const { default: configRouter } = await import('./config');
    const app = express().use(configRouter);

    const res = await request(app).get('/config');
    expect(res.body.SocialClients.GoogleClientId).toBe('base-id');
    expect(res.body.DescopeProjectId).toBe('test-descope-id');
  });
});
