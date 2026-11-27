import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getAppBaseUrl, getAppEnvironment, LOCAL_BASE_URL } from './environment';

type GlobalWithProcess = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

describe('environment utils', () => {
  const globalObj = globalThis as GlobalWithProcess;
  let originalProcess: { env?: Record<string, string | undefined> } | undefined;

  beforeEach(() => {
    originalProcess = globalObj.process;
    globalObj.process = { env: {} };
  });

  afterEach(() => {
    if (originalProcess) {
      globalObj.process = originalProcess;
    } else {
      delete globalObj.process;
    }
  });

  describe('getAppEnvironment', () => {
    it('should return local when VERCEL_ENV is not set', () => {
      expect(getAppEnvironment({})).toBe('local');
      expect(getAppEnvironment()).toBe('local');
    });

    it('should return local when process is undefined', () => {
      delete globalObj.process;
      expect(getAppEnvironment()).toBe('local');
    });

    it('should return preview when VERCEL_ENV is preview', () => {
      expect(getAppEnvironment({ VERCEL_ENV: 'preview' })).toBe('preview');
      globalObj.process!.env!['VERCEL_ENV'] = 'preview';
      expect(getAppEnvironment()).toBe('preview');
    });

    it('should return live when VERCEL_ENV is production', () => {
      expect(getAppEnvironment({ VERCEL_ENV: 'production' })).toBe('live');
      globalObj.process!.env!['VERCEL_ENV'] = 'production';
      expect(getAppEnvironment()).toBe('live');
    });

    it('should return local for unknown VERCEL_ENV values', () => {
      expect(getAppEnvironment({ VERCEL_ENV: 'development' })).toBe('local');
    });
  });

  describe('getAppBaseUrl', () => {
    it('should return http://localhost:4200 when environment is local', () => {
      expect(getAppBaseUrl({})).toBe(LOCAL_BASE_URL);
      expect(
        getAppBaseUrl({
          VERCEL_URL: 'ignored-preview.vercel.app',
          VERCEL_PROJECT_PRODUCTION_URL: 'ignored-prod.com',
        }),
      ).toBe(LOCAL_BASE_URL);
    });

    it('should return VERCEL_URL when environment is preview', () => {
      expect(
        getAppBaseUrl({
          VERCEL_ENV: 'preview',
          VERCEL_URL: 'my-preview.vercel.app',
          VERCEL_PROJECT_PRODUCTION_URL: 'delishamarie.com',
        }),
      ).toBe('https://my-preview.vercel.app');
    });

    it('should preserve protocol and strip trailing slash for preview VERCEL_URL', () => {
      expect(
        getAppBaseUrl({
          VERCEL_ENV: 'preview',
          VERCEL_URL: 'https://my-preview.vercel.app/',
        }),
      ).toBe('https://my-preview.vercel.app');

      expect(
        getAppBaseUrl({
          VERCEL_ENV: 'preview',
          VERCEL_URL: 'localhost:4200',
        }),
      ).toBe('http://localhost:4200');
    });

    it('should fallback to LOCAL_BASE_URL when preview VERCEL_URL is missing', () => {
      expect(getAppBaseUrl({ VERCEL_ENV: 'preview' })).toBe(LOCAL_BASE_URL);
    });

    it('should return VERCEL_PROJECT_PRODUCTION_URL when environment is live', () => {
      expect(
        getAppBaseUrl({
          VERCEL_ENV: 'production',
          VERCEL_URL: 'deployment-hash.vercel.app',
          VERCEL_PROJECT_PRODUCTION_URL: 'delishamarie.com',
        }),
      ).toBe('https://delishamarie.com');
    });

    it('should preserve protocol and strip trailing slash for live VERCEL_PROJECT_PRODUCTION_URL', () => {
      expect(
        getAppBaseUrl({
          VERCEL_ENV: 'production',
          VERCEL_PROJECT_PRODUCTION_URL: 'https://delishamarie.com/',
        }),
      ).toBe('https://delishamarie.com');

      expect(
        getAppBaseUrl({
          VERCEL_ENV: 'production',
          VERCEL_PROJECT_PRODUCTION_URL: '127.0.0.1:4200',
        }),
      ).toBe('http://127.0.0.1:4200');
    });

    it('should fallback to LOCAL_BASE_URL when live VERCEL_PROJECT_PRODUCTION_URL is missing', () => {
      expect(getAppBaseUrl({ VERCEL_ENV: 'production' })).toBe(LOCAL_BASE_URL);
    });

    it('should read from globalThis.process.env by default', () => {
      globalObj.process!.env!['VERCEL_ENV'] = 'production';
      globalObj.process!.env!['VERCEL_PROJECT_PRODUCTION_URL'] = 'delishamarie.com';
      expect(getAppBaseUrl()).toBe('https://delishamarie.com');
    });
  });
});
