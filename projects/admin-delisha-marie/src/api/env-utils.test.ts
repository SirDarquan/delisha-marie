import fs from 'node:fs';
import { findSourceMap } from 'node:module';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi, afterEach, type MockInstance } from 'vitest';
import { loadCascadingEnvs, getSourceDir } from './env-utils';

vi.mock('node:module', () => ({
  findSourceMap: vi.fn(),
}));

interface SourceMapPayload {
  sources: string[];
}
interface MockSourceMap {
  payload: SourceMapPayload;
}

describe('Environment Utilities Service', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let existsSpy: MockInstance<typeof fs.existsSync>;
  let readSpy: MockInstance<typeof fs.readFileSync>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    readSpy = vi.spyOn(fs, 'readFileSync').mockReturnValue('');
    vi.mocked(findSourceMap).mockReturnValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('loadCascadingEnvs', () => {
    it('should process chain when target is sub-directory', () => {
      const start = path.resolve('C:\\root');
      const target = path.resolve('C:\\root\\sub1\\sub2');
      existsSpy.mockReturnValue(true);
      readSpy.mockReturnValue('KEY1=val1');

      loadCascadingEnvs(start, target, '.testenv');

      expect(readSpy).toHaveBeenCalledTimes(3);
      expect(process.env['KEY1']).toBe('val1');
    });

    it('should fall back to just start and target if not a subdir', () => {
      const start = path.resolve('C:\\root');
      const target = path.resolve('D:\\other');
      existsSpy.mockReturnValue(true);
      readSpy.mockReturnValue('UNREL=yes');

      loadCascadingEnvs(start, target, '.testenv');
      expect(readSpy).toHaveBeenCalledTimes(2);
    });

    it('should skip loading if file does not exist', () => {
      existsSpy.mockReturnValue(false);
      loadCascadingEnvs('/a', '/a/b');
      expect(readSpy).not.toHaveBeenCalled();
    });

    it('should not overwrite existing env variable values', () => {
      process.env['EXISTING_VAR'] = 'keep_me';
      existsSpy.mockReturnValue(true);
      readSpy.mockReturnValue('EXISTING_VAR=overwrite_me');

      loadCascadingEnvs('/a', '/a');
      expect(process.env['EXISTING_VAR']).toBe('keep_me');
    });

    it('should log an error to console if file parsing crashes', () => {
      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      existsSpy.mockReturnValue(true);
      readSpy.mockImplementation(() => {
        throw new Error('Corrupt disk');
      });

      loadCascadingEnvs('/a', '/a');
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('getSourceDir', () => {
    it('should execute internal SourceMap extraction and find match', () => {
      const mockUri = 'file:///C:/project/src/api/index.ts';
      const mockMap: MockSourceMap = { payload: { sources: [mockUri] } };
      vi.mocked(findSourceMap).mockReturnValue(
        mockMap as unknown as ReturnType<typeof findSourceMap>,
      );

      existsSpy.mockImplementation((p) => String(p).includes('index.ts'));

      const dir = getSourceDir('/api');
      expect(dir).toBeTruthy();
      expect(findSourceMap).toHaveBeenCalled();
    });

    it('should handle non-file protocol matching path string', () => {
      const mockUri = 'C:\\project\\src\\api\\index.ts';
      const mockMap: MockSourceMap = { payload: { sources: [mockUri] } };
      vi.mocked(findSourceMap).mockReturnValue(
        mockMap as unknown as ReturnType<typeof findSourceMap>,
      );

      existsSpy.mockReturnValue(true);

      const dir = getSourceDir('/api');
      expect(dir).toContain('api');
    });

    it('should silently fall back to current directory if map is missing', () => {
      vi.mocked(findSourceMap).mockReturnValue(undefined);
      const dir = getSourceDir('/fake');
      expect(dir).toBeTruthy();
    });

    it('should return current directory if sources exists but target not found', () => {
      const mockMap: MockSourceMap = { payload: { sources: ['/other/path/test.js'] } };
      vi.mocked(findSourceMap).mockReturnValue(
        mockMap as unknown as ReturnType<typeof findSourceMap>,
      );
      const dir = getSourceDir('/MISSING');
      expect(dir).toBeTruthy();
    });

    it('should safely handle the internal API throwing an exception', () => {
      vi.mocked(findSourceMap).mockImplementation(() => {
        throw new Error('Internal Crash');
      });
      const dir = getSourceDir('/api');
      expect(dir).toBeTruthy();
    });
  });
});
