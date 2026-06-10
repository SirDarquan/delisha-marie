import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';
import { WINDOW } from './global-tokens';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    clear: () => {
      for (const key in store) {
        delete store[key];
      }
    },
    getItem: (key: string) => store[key] || null,
    key: (index: number) => Object.keys(store)[index] || null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    get length() {
      return Object.keys(store).length;
    },
  } as unknown as Storage;
}

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Clear localStorage
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial light theme by default', () => {
    expect(service.isDark()).toBe(false);
  });

  it('should toggle theme', () => {
    service.toggle();
    expect(service.isDark()).toBe(true);
    service.toggle();
    expect(service.isDark()).toBe(false);
  });

  it('should sync with localStorage and document class', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

    service.toggle();
    TestBed.flushEffects();
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should load initial theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    // Re-inject service to trigger constructor logic
    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.isDark()).toBe(true);
  });

  it('should load initial theme from system preference if localStorage is empty', () => {
    // Mock matchMedia to return dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.isDark()).toBe(true);
  });

  describe('Non-browser platform', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: WINDOW, useValue: {} },
        ],
      });
    });

    it('should return false for initial theme when not on browser platform', () => {
      const serverService = TestBed.inject(ThemeService);
      expect(serverService.isDark()).toBe(false);
    });

    it('should not sync with localStorage or document class when not on browser platform', () => {
      const spySetItem = vi.spyOn(Storage.prototype, 'setItem');
      const serverService = TestBed.inject(ThemeService);

      serverService.toggle();
      TestBed.flushEffects();

      expect(spySetItem).not.toHaveBeenCalled();
      expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    });
  });
});
