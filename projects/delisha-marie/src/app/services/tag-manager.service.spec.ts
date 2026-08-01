import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { GoogleTagManagerPlugin } from './tag-manager.service';
import { AppConfigService } from './config.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('GoogleTagManagerPlugin', () => {
  let plugin: GoogleTagManagerPlugin;
  let mockDocument: Record<string, unknown>;
  let mockConfigService: Record<string, unknown>;
  let mockWindow: Record<string, unknown>;

  beforeEach(() => {
    mockWindow = {
      dataLayer: undefined,
      gtag: undefined,
    };

    mockDocument = {
      defaultView: mockWindow,
      createElement: vi.fn().mockImplementation((tagName: string) => {
        return {
          tagName,
          src: '',
          async: false,
          onload: null,
          onerror: null,
        };
      }),
      head: {
        prepend: vi.fn(),
      },
    };

    mockConfigService = {
      GoogleTagManagerConfig: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GoogleTagManagerPlugin,
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: AppConfigService, useValue: mockConfigService },
      ],
    });

    plugin = TestBed.inject(GoogleTagManagerPlugin);
  });

  it('should be created', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.id).toBe('gtm');
    expect(plugin.order).toBe(10);
  });

  describe('isEnabled', () => {
    it('should always return true', () => {
      expect(plugin.isEnabled()).toBe(true);
    });
  });

  describe('init', () => {
    it('should do nothing if window is not available', async () => {
      mockDocument.defaultView = null;
      await plugin.init();
      expect(mockConfigService.GoogleTagManagerConfig).not.toHaveBeenCalled();
    });

    it('should do nothing if GTM config id is missing', async () => {
      mockConfigService.GoogleTagManagerConfig.mockReturnValue({ id: null });
      await plugin.init();
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should load script and setup GTM if id is provided', async () => {
      const gtmId = 'GTM-TEST';
      mockConfigService.GoogleTagManagerConfig.mockReturnValue({ id: gtmId });

      let resolveScript: () => void;
      mockDocument.createElement.mockImplementation((tagName: string) => {
        const script: Record<string, unknown> = {
          tagName,
          src: '',
          async: false,
        };
        Object.defineProperty(script, 'onload', {
          set: (fn) => (resolveScript = fn),
          get: () => resolveScript,
        });
        return script;
      });

      const initPromise = plugin.init();
      resolveScript!();
      await initPromise;

      expect(mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(mockDocument.head.prepend).toHaveBeenCalled();

      expect(mockWindow.dataLayer).toBeDefined();
      expect(mockWindow.gtag).toBeDefined();

      mockWindow.dataLayer.push = vi.fn();
      mockWindow.gtag.apply(mockWindow, ['event', 'test']);
      expect(mockWindow.dataLayer.push).toHaveBeenCalled();
    });

    it('should reject if script fails to load', async () => {
      mockConfigService.GoogleTagManagerConfig.mockReturnValue({ id: 'GTM-FAIL' });

      let rejectScript: () => void;
      mockDocument.createElement.mockImplementation((tagName: string) => {
        const script: Record<string, unknown> = {
          tagName,
        };
        Object.defineProperty(script, 'onerror', {
          set: (fn) => (rejectScript = fn),
          get: () => rejectScript,
        });
        return script;
      });

      const initPromise = plugin.init();
      rejectScript!();

      await expect(initPromise).rejects.toBeUndefined();
    });
  });
});
