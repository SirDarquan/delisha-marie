import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { APP_PLUGINS } from '@dm/library';
import { AppConfigService } from '../services/config.service';
import { provideAppConfig } from './app-config';

describe('provideAppConfig (admin-delisha-marie)', () => {
  it('should provide AppConfigService as an APP_PLUGINS multi-provider', () => {
    const mockAppConfigService = {} as unknown as AppConfigService;

    TestBed.configureTestingModule({
      providers: [
        { provide: AppConfigService, useValue: mockAppConfigService },
        ...provideAppConfig(),
      ],
    });

    const plugins = TestBed.inject(APP_PLUGINS);
    expect(plugins).toBeDefined();
    expect(plugins).toContain(mockAppConfigService);
  });
});
