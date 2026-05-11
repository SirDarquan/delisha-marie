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

  it('should execute SourceMap extraction internally when map is detected on load', async () => {
    const mockUri = 'file:///C:/Source/projects/admin-delisha-marie/src/api/config.ts';
    const nonFileUri = 'C:/Source/projects/admin-delisha-marie/src/api/config.ts';

    const mockMap: MockSourceMap = {
      payload: { sources: [nonFileUri, mockUri] },
    };

    // Typecast safely through unknown to satisfy the return type interface expected by Node types
    vi.mocked(findSourceMap).mockReturnValue(
      mockMap as unknown as ReturnType<typeof findSourceMap>,
    );

    existsSpy.mockImplementation((p) => String(p).includes('config.ts'));

    await import('./config');

    expect(findSourceMap).toHaveBeenCalled();
  });

  it('should gracefully handle internal API throwing exception', async () => {
    vi.mocked(findSourceMap).mockImplementation(() => {
      throw new Error('Forced Internal API Failure');
    });

    await expect(import('./config')).resolves.toBeTruthy();
  });

  it('should traverse disjoint loading chain when cwd is separated from source root', async () => {
    process.cwd = vi.fn().mockReturnValue('Z:\\disjoint-workspace\\mount');

    existsSpy.mockReturnValue(true);
    readSpy.mockReturnValue('DYNAMIC_KEY=MOCKED_VAL');

    await import('./config');

    expect(existsSpy).toHaveBeenCalled();
    expect(process.env['DYNAMIC_KEY']).toBe('MOCKED_VAL');
  });

  it('should tolerate and log runtime corruption during automated file processing', async () => {
    // Use non-empty statement to satisfy no-empty-function rule
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return;
    });

    existsSpy.mockReturnValue(true);
    readSpy.mockImplementation(() => {
      throw new Error('Drive Read Fault');
    });

    await import('./config');

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
