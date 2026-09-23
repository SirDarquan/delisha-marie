import { describe, expect, it } from 'vitest';
import { getKitchenUrl } from './navigation';

describe('getKitchenUrl', () => {
  it('should return http://localhost:4200 in dev mode on localhost', () => {
    expect(getKitchenUrl({ hostname: 'localhost', isDev: true })).toBe('http://localhost:4200');
    expect(getKitchenUrl({ hostname: '127.0.0.1', isDev: true })).toBe('http://localhost:4200');
  });

  it('should return /kitchen for production hostname even in dev mode', () => {
    expect(getKitchenUrl({ hostname: 'delisha-marie.com', isDev: true })).toBe('/kitchen');
    expect(getKitchenUrl({ hostname: 'delisha-home.vercel.app', isDev: true })).toBe('/kitchen');
  });

  it('should return /kitchen when not in dev mode on localhost', () => {
    expect(getKitchenUrl({ hostname: 'localhost', isDev: false })).toBe('/kitchen');
  });

  it('should fallback to window.location.hostname when hostname option is omitted', () => {
    const result = getKitchenUrl();
    expect(result).toBeDefined();
    expect(result.endsWith('/kitchen')).toBe(false);
  });
});
