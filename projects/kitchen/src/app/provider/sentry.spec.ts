import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { APP_PLUGINS } from '@dm/library';
import { AppConfigService } from '../services/config.service';
import { SentryPlugin } from '../services/sentry.service';
import { provideSentry } from './sentry';

describe('provideSentry', () => {
  it('should provide SentryPlugin as an APP_PLUGINS multi-provider', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AppConfigService, useValue: { SentryConfig: () => null } },
        provideSentry(),
      ],
    });

    const plugins = TestBed.inject(APP_PLUGINS);
    expect(plugins).toBeDefined();
    expect(plugins.some((p) => p instanceof SentryPlugin)).toBe(true);
  });
});
