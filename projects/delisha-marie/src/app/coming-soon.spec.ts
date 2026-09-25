import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { AppEx, appConfigEx, isKitchenReleased, KITCHEN_RELEASE_TIMESTAMP } from './coming-soon';

describe('coming-soon', () => {
  it('should define KITCHEN_RELEASE_TIMESTAMP as Dec 1, 2026 UTC', () => {
    expect(KITCHEN_RELEASE_TIMESTAMP).toBe(new Date('2026-12-01T00:00:00Z').getTime());
  });

  it('should create AppEx component', () => {
    const fixture = TestBed.createComponent(AppEx);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should configure appConfigEx providers', () => {
    expect(appConfigEx.providers).toBeDefined();
    expect(appConfigEx.providers.length).toBeGreaterThan(0);
  });

  describe('isKitchenReleased', () => {
    it('should return true when server date is at or after release date', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({ date: 'Tue, 01 Dec 2026 00:00:00 GMT' }),
      } as Response);

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/config', { method: 'HEAD' });
    });

    it('should return false when server date is before release date', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({ date: 'Mon, 30 Nov 2026 23:59:59 GMT' }),
      } as Response);

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(false);
    });

    it('should return false when date header is missing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        headers: new Headers({}),
      } as Response);

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await isKitchenReleased(mockFetch as unknown as typeof fetch);
      expect(result).toBe(false);
    });

    it('should use default fetch when no fetchFn parameter is provided', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        headers: new Headers({ date: 'Tue, 01 Dec 2026 00:00:01 GMT' }),
      } as Response);

      const result = await isKitchenReleased();
      expect(result).toBe(true);

      fetchSpy.mockRestore();
    });
  });
});
