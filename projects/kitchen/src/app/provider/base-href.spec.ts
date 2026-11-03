import { APP_BASE_HREF } from '@angular/common';
import { enableProdMode, isDevMode } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { provideBaseHref } from './base-href';

describe('provideBaseHref', () => {
  it('should return "/" when in devMode', () => {
    if (isDevMode()) {
      const result = provideBaseHref('/custom-base/');
      expect(result).toEqual([{ provide: APP_BASE_HREF, useValue: '/' }]);
    }
  });

  it('should return baseHref when in prodMode', () => {
    try {
      enableProdMode();
    } catch {
      // Prod mode may already be enabled or cannot be set more than once
    }
    const result = provideBaseHref('/custom-base/');
    if (!isDevMode()) {
      expect(result).toEqual([{ provide: APP_BASE_HREF, useValue: '/custom-base/' }]);
    } else {
      expect(result).toEqual([{ provide: APP_BASE_HREF, useValue: '/' }]);
    }
  });
});
