import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppEx,
  appConfigEx,
  calculateCountdown,
  getAuthoritativeTime,
  isKitchenReleased,
  isLive,
  KITCHEN_RELEASE_TIMESTAMP,
  syncServerTime,
  TimeSyncState,
} from './coming-soon';

describe('coming-soon', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should define KITCHEN_RELEASE_TIMESTAMP as Dec 2, 2026 10:00 AM Panama time (UTC-5)', () => {
    expect(KITCHEN_RELEASE_TIMESTAMP).toBe(new Date('2026-12-02T10:00:00-05:00').getTime());
  });

  it('should configure appConfigEx providers', () => {
    expect(appConfigEx.providers).toBeDefined();
    expect(appConfigEx.providers.length).toBeGreaterThan(0);
  });

  describe('syncServerTime', () => {
    it('should return synchronized state with parsed server time when date header exists', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({ date: 'Wed, 02 Dec 2026 15:00:00 GMT' }),
      } as Response);

      const state = await syncServerTime(mockFetch as unknown as typeof fetch);
      expect(state.synchronized).toBe(true);
      expect(state.initialServerTime).toBe(new Date('2026-12-02T15:00:00Z').getTime());
      expect(state.initialPerfTime).toBeGreaterThanOrEqual(0);
    });

    it('should return unsynchronized state when date header is missing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({}),
      } as Response);

      const state = await syncServerTime(mockFetch as unknown as typeof fetch);
      expect(state.synchronized).toBe(false);
      expect(state.initialServerTime).toBeGreaterThan(0);
    });

    it('should return unsynchronized state when date header is invalid', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({ date: 'Invalid Date String' }),
      } as Response);

      const state = await syncServerTime(mockFetch as unknown as typeof fetch);
      expect(state.synchronized).toBe(false);
    });

    it('should return unsynchronized state when fetch rejects', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const state = await syncServerTime(mockFetch as unknown as typeof fetch);
      expect(state.synchronized).toBe(false);
    });

    it('should use global fetch by default', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        headers: new Headers({ date: 'Tue, 01 Dec 2026 00:00:00 GMT' }),
      } as Response);

      const state = await syncServerTime();
      expect(state.synchronized).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith('/config', { method: 'HEAD' });
    });
  });

  describe('getAuthoritativeTime', () => {
    it('should compute time based on initial server time plus elapsed monotonic performance time', () => {
      const state: TimeSyncState = {
        initialServerTime: 1000000,
        initialPerfTime: 500,
        synchronized: true,
      };

      vi.spyOn(performance, 'now').mockReturnValue(1500);

      const authTime = getAuthoritativeTime(state);
      expect(authTime).toBe(1000000 + (1500 - 500));
    });
  });

  describe('calculateCountdown', () => {
    it('should calculate remaining days, hours, minutes, and seconds correctly', () => {
      const target = 100000000;
      // 1 day, 2 hours, 3 minutes, 4 seconds before target
      const oneDayTwoHoursThreeMinFourSec =
        1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 3 * 60 * 1000 + 4 * 1000;
      const now = target - oneDayTwoHoursThreeMinFourSec;

      const breakdown = calculateCountdown(now, target);
      expect(breakdown.isReleased).toBe(false);
      expect(breakdown.days).toBe(1);
      expect(breakdown.hours).toBe(2);
      expect(breakdown.minutes).toBe(3);
      expect(breakdown.seconds).toBe(4);
      expect(breakdown.totalMs).toBe(oneDayTwoHoursThreeMinFourSec);
    });

    it('should set isReleased to true and units to zero when current time equals or exceeds target', () => {
      const target = 100000000;
      const now = target + 5000;

      const breakdown = calculateCountdown(now, target);
      expect(breakdown.isReleased).toBe(true);
      expect(breakdown.days).toBe(0);
      expect(breakdown.hours).toBe(0);
      expect(breakdown.minutes).toBe(0);
      expect(breakdown.seconds).toBe(0);
      expect(breakdown.totalMs).toBe(0);
    });
  });

  describe('isKitchenReleased', () => {
    it('should return true when server date is at or after release date', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({ date: 'Wed, 02 Dec 2026 15:00:00 GMT' }),
      } as Response);

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(true);
    });

    it('should return false when server date is before release date', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({ date: 'Wed, 02 Dec 2026 14:59:59 GMT' }),
      } as Response);

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(false);
    });

    it('should return false when date header is missing or sync fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({}),
      } as Response);

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(false);
    });

    it('should return false when fetch throws', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(false);
    });
  });

  describe('isLive', () => {
    it('should return true when hostname ends with vercel.app', async () => {
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { hostname: 'delisha-preview.vercel.app' },
        writable: true,
        configurable: true,
      });

      const result = await isLive();
      expect(result).toBe(true);

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('should return true when process.env.VERCEL_ENV is preview', async () => {
      const originalWindow = globalThis.window;
      // Temporarily simulate server environment (window undefined)
      // @ts-expect-error simulating server
      delete globalThis.window;
      process.env['VERCEL_ENV'] = 'preview';

      const result = await isLive();
      expect(result).toBe(true);

      delete process.env['VERCEL_ENV'];
      globalThis.window = originalWindow;
    });

    it('should return true when isKitchenReleased is true', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        headers: new Headers({ date: 'Wed, 02 Dec 2026 15:00:01 GMT' }),
      } as Response);

      const result = await isLive();
      expect(result).toBe(true);
    });

    it('should return false when not preview, dev mode is active, and kitchen is not released', async () => {
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { hostname: 'delisha-marie.com' },
        writable: true,
        configurable: true,
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        headers: new Headers({ date: 'Wed, 02 Dec 2026 09:00:00 GMT' }),
      } as Response);

      const result = await isLive();
      expect(result).toBe(false);

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('AppEx Component', () => {
    let fixture: ComponentFixture<AppEx>;
    let component: AppEx;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppEx],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      }).compileComponents();

      fixture = TestBed.createComponent(AppEx);
      component = fixture.componentInstance;
    });

    it('should create AppEx component and render header elements', () => {
      expect(component).toBeTruthy();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('header')).toBeTruthy();
      expect(compiled.textContent).toContain('Delisha');
      expect(compiled.textContent).toContain('Marie');
      expect(compiled.textContent).toContain('Return to Home');
    });

    it('should render padded countdown cards and accessible screen reader text when not released', () => {
      // Advance to 67 days, 7 hours, 5 minutes, 3 seconds before target
      const target = KITCHEN_RELEASE_TIMESTAMP;
      const msBefore = 67 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000 + 5 * 60 * 1000 + 3 * 1000;
      component.authoritativeNow.set(target - msBefore);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Grand Opening Countdown');
      expect(compiled.textContent).toContain('The Kitchen is');
      expect(compiled.textContent).toContain('Coming Soon');

      // Check formatted zero padding
      expect(component.formattedCountdown().days).toBe('67');
      expect(component.formattedCountdown().hours).toBe('07');
      expect(component.formattedCountdown().minutes).toBe('05');
      expect(component.formattedCountdown().seconds).toBe('03');

      // Check screen reader accessible element
      const srText = compiled.querySelector('.sr-only');
      expect(srText).toBeTruthy();
      expect(srText?.textContent).toContain('December 2, 2026 at 10:00 AM');
      expect(srText?.textContent).toContain('67 days');
      expect(srText?.textContent).toContain('7 hours');
      expect(srText?.textContent).toContain('5 minutes');
    });

    it('should render released state when countdown isReleased is true', () => {
      component.authoritativeNow.set(KITCHEN_RELEASE_TIMESTAMP + 10000);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('The Kitchen Doors Are Open!');
      expect(compiled.textContent).toContain('Enter Kitchen');
    });

    it('should initialize and tick timer on ngOnInit in browser', async () => {
      vi.useFakeTimers();
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        headers: new Headers({ date: 'Thu, 25 Sep 2026 12:00:00 GMT' }),
      } as Response);

      component.ngOnInit();
      await Promise.resolve();
      expect(fetchSpy).toHaveBeenCalled();

      // Fast forward 1 second
      vi.advanceTimersByTime(1000);
      expect(component.countdown().totalMs).toBeGreaterThan(0);
    });

    it('should not initialize timer when platform is not browser', () => {
      const serverFixture = TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [AppEx],
          providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
        })
        .createComponent(AppEx);

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      serverFixture.componentInstance.ngOnInit();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should invoke reloadPage when reload button is clicked', () => {
      const reloadSpy = vi.spyOn(component, 'reloadPage').mockReturnValue(undefined);
      component.authoritativeNow.set(KITCHEN_RELEASE_TIMESTAMP + 5000);
      fixture.detectChanges();

      const enterBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(enterBtn).toBeTruthy();
      enterBtn.click();

      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should trigger reload in tick when released', () => {
      const reloadSpy = vi.spyOn(component, 'reloadPage').mockReturnValue(undefined);
      component['syncState'] = {
        initialServerTime: KITCHEN_RELEASE_TIMESTAMP + 1000,
        initialPerfTime: performance.now(),
        synchronized: true,
      };

      component.tick();
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should safely reload via injected Document defaultView', () => {
      const mockReload = vi.fn();
      const mockDoc = {
        defaultView: {
          location: { reload: mockReload },
        },
      };
      (component as unknown as { document: typeof mockDoc }).document = mockDoc;

      component.reloadPage();
      expect(mockReload).toHaveBeenCalled();
    });
  });
});
