import { describe, expect, it } from 'vitest';
import { getHomeUrl } from './navigation';

describe('navigation utils', () => {
  describe('getHomeUrl', () => {
    it('should return http://localhost:4220 on localhost in dev mode', () => {
      expect(getHomeUrl('', { hostname: 'localhost', isDev: true })).toBe('http://localhost:4220');
      expect(getHomeUrl('/', { hostname: '127.0.0.1', isDev: true })).toBe(
        'http://localhost:4220/',
      );
    });

    it('should return http://localhost:4220/about and /contact in dev mode', () => {
      expect(getHomeUrl('/about', { hostname: 'localhost', isDev: true })).toBe(
        'http://localhost:4220/about',
      );
      expect(getHomeUrl('contact', { hostname: 'localhost', isDev: true })).toBe(
        'http://localhost:4220/contact',
      );
    });

    it('should return relative path in production or non-localhost', () => {
      expect(getHomeUrl('', { hostname: 'delisha-marie.com', isDev: true })).toBe('/');
      expect(getHomeUrl('/about', { hostname: 'delisha-marie.com', isDev: true })).toBe('/about');
      expect(getHomeUrl('contact', { hostname: 'delisha-marie.com', isDev: true })).toBe(
        '/contact',
      );
      expect(getHomeUrl('/about', { hostname: 'localhost', isDev: false })).toBe('/about');
    });

    it('should fallback to window.location.hostname when hostname option is omitted', () => {
      const result = getHomeUrl('/about');
      expect(result).toBeDefined();
      expect(result.includes('about')).toBe(true);
    });
  });
});
