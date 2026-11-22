import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

function clearThemeCookie() {
  document.cookie = 'theme=; path=/; max-age=0';
}

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    clearThemeCookie();
    document.documentElement.classList.remove('dark-theme');

    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    clearThemeCookie();
    document.documentElement.classList.remove('dark-theme');
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should always have initial light theme by default when no cookie is present', () => {
    expect(service.isDark()).toBe(false);
  });

  it('should toggle theme', () => {
    service.toggle();
    expect(service.isDark()).toBe(true);
    service.toggle();
    expect(service.isDark()).toBe(false);
  });

  it('should sync with document.cookie and document class', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(document.cookie).toContain('theme=dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

    service.toggle();
    TestBed.flushEffects();
    expect(document.cookie).toContain('theme=light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should load initial dark theme from document.cookie', () => {
    document.cookie = 'theme=dark; path=/';
    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.isDark()).toBe(true);
  });

  it('should load initial light theme when document.cookie is theme=light', () => {
    document.cookie = 'theme=light; path=/';
    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.isDark()).toBe(false);
  });

  describe('Non-browser platform (SSR)', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    it('should return false for initial theme when REQUEST is not provided', () => {
      TestBed.configureTestingModule({
        providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(ThemeService);
      expect(serverService.isDark()).toBe(false);
    });

    it('should read dark theme from Web Request cookie header and update documentElement without setting document.cookie', () => {
      const mockReq = new Request('http://localhost:4200/', {
        headers: { cookie: 'other=1; theme=dark; foo=bar' },
      });
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: mockReq },
        ],
      });
      const cookieSetterSpy = vi.spyOn(document, 'cookie', 'set');
      const serverService = TestBed.inject(ThemeService);
      TestBed.flushEffects();

      expect(serverService.isDark()).toBe(true);
      expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
      expect(cookieSetterSpy).not.toHaveBeenCalled();
    });

    it('should read theme from Node/Express-style request headers (string and array)', () => {
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: { headers: { Cookie: ['a=1', 'theme=dark'] } } },
        ],
      });
      const serverService = TestBed.inject(ThemeService);
      expect(serverService.isDark()).toBe(true);
    });

    it('should handle REQUEST object without headers or empty cookie header gracefully', () => {
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: {} },
        ],
      });
      expect(TestBed.inject(ThemeService).isDark()).toBe(false);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: { headers: {} } },
        ],
      });
      expect(TestBed.inject(ThemeService).isDark()).toBe(false);
    });
  });
});
