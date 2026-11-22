import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieService } from './cookie.service';

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

describe('CookieService', () => {
  describe('Browser platform', () => {
    let service: CookieService;

    beforeEach(() => {
      clearCookie('theme');
      clearCookie('custom');
      TestBed.configureTestingModule({
        providers: [CookieService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(CookieService);
    });

    afterEach(() => {
      clearCookie('theme');
      clearCookie('custom');
      vi.restoreAllMocks();
    });

    it('should return null when cookie is not present', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    it('should return null when document.cookie is empty', () => {
      vi.spyOn(document, 'cookie', 'get').mockReturnValue('');
      expect(service.getRawCookieString()).toBeNull();
      expect(service.get('theme')).toBeNull();
    });

    it('should set and get a cookie with default options', () => {
      const setterSpy = vi.spyOn(document, 'cookie', 'set');
      service.set('theme', 'dark', { maxAge: 31536000 });
      expect(setterSpy).toHaveBeenCalledWith('theme=dark; path=/; max-age=31536000; SameSite=Lax');
      expect(service.get('theme')).toBe('dark');
      expect(service.getRawCookieString()).toContain('theme=dark');
    });

    it('should set a cookie with custom path, sameSite, and secure options', () => {
      const setterSpy = vi.spyOn(document, 'cookie', 'set');
      service.set('custom', 'val', {
        path: '/kitchen',
        sameSite: 'Strict',
        secure: true,
      });
      expect(setterSpy).toHaveBeenCalledWith('custom=val; path=/kitchen; SameSite=Strict; Secure');
    });
  });

  describe('Server platform (SSR)', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    it('should return null and not write to document.cookie when REQUEST is missing', () => {
      TestBed.configureTestingModule({
        providers: [CookieService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const setterSpy = vi.spyOn(document, 'cookie', 'set');
      const service = TestBed.inject(CookieService);

      expect(service.getRawCookieString()).toBeNull();
      expect(service.get('theme')).toBeNull();

      service.set('theme', 'dark');
      expect(setterSpy).not.toHaveBeenCalled();
    });

    it('should read cookies from Web Request Headers instance', () => {
      const mockReq = new Request('http://localhost:4200/', {
        headers: { cookie: 'a=1; theme=dark; b=2' },
      });
      TestBed.configureTestingModule({
        providers: [
          CookieService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: mockReq },
        ],
      });
      const service = TestBed.inject(CookieService);
      expect(service.getRawCookieString()).toBe('a=1; theme=dark; b=2');
      expect(service.get('theme')).toBe('dark');
      expect(service.get('missing')).toBeNull();
    });

    it('should read cookies from Node/Express header dictionary (string and array)', () => {
      TestBed.configureTestingModule({
        providers: [
          CookieService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: { headers: { Cookie: ['session=abc', 'theme=light'] } } },
        ],
      });
      const service = TestBed.inject(CookieService);
      expect(service.getRawCookieString()).toBe('session=abc; theme=light');
      expect(service.get('theme')).toBe('light');
      expect(service.get('session')).toBe('abc');
    });

    it('should handle REQUEST object without headers or non-object REQUEST gracefully', () => {
      TestBed.configureTestingModule({
        providers: [
          CookieService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: {} },
        ],
      });
      expect(TestBed.inject(CookieService).getRawCookieString()).toBeNull();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CookieService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: { headers: {} } },
        ],
      });
      expect(TestBed.inject(CookieService).getRawCookieString()).toBeNull();
    });
  });
});
