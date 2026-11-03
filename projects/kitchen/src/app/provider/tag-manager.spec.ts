import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { APP_PLUGINS } from '@dm/library';
import { AppConfigService } from '../services/config.service';
import { GoogleTagManagerPlugin } from '../services/tag-manager.service';
import { provideGtm } from './tag-manager';

describe('provideGtm', () => {
  it('should provide GoogleTagManagerPlugin as an APP_PLUGINS multi-provider', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AppConfigService, useValue: { GoogleTagManagerConfig: () => null } },
        provideGtm(),
      ],
    });

    const plugins = TestBed.inject(APP_PLUGINS);
    expect(plugins).toBeDefined();
    expect(plugins.some((p) => p instanceof GoogleTagManagerPlugin)).toBe(true);
  });
});
