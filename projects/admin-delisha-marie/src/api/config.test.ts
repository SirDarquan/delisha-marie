import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import { findSourceMap } from 'node:module';
import { describe, it, expect, beforeEach, vi, afterEach, type MockInstance } from 'vitest';

// Type-safe SourceMap payload definitions
interface SourceMapPayload {
  sources: string[];
}
interface MockSourceMap {
  payload: SourceMapPayload;
}

vi.mock('node:module', () => ({
  findSourceMap: vi.fn(),
}));

describe('Config Router Service - Self-Initialization Lifecycle', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: typeof process.cwd;
  let existsSpy: MockInstance<typeof fs.existsSync>;
  let readSpy: MockInstance<typeof fs.readFileSync>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    originalCwd = process.cwd;

    // Setup robust spy interceptors on fs methods
    existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    readSpy = vi.spyOn(fs, 'readFileSync').mockReturnValue('');

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

    const { default: configRouter } = await import('./config');
    const app = express().use(configRouter);

    const res = await request(app).get('/config');
    expect(res.body.SocialClients.GoogleClientId).toBe('base-id');
  });

});
