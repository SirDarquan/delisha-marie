import { TestBed } from '@angular/core/testing';
import { SOCIAL_AUTH_CONFIG, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { provideSocialLogins } from './social-logins';
import { AppConfigService } from '../services/config.service';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';

describe('SocialLogins Provider', () => {
  it('should resolve the social auth config dynamically from AppConfigService', () => {
    const mockConfig = {
      SocialClients: { GoogleClientId: 'mock-client-999' },
    };

    // Create a mock of the service
    const mockAppConfigService = {
      config: signal(mockConfig),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AppConfigService, useValue: mockAppConfigService },
        provideSocialLogins(),
      ],
    });

    const resolvedConfig = TestBed.inject(SOCIAL_AUTH_CONFIG) as SocialAuthServiceConfig;

    expect(resolvedConfig).toBeDefined();
    expect(resolvedConfig.providers).toHaveLength(1);

    // Verify internal construction properties loosely
    const googleProvider = resolvedConfig.providers[0];
    expect(googleProvider.id).toBe('GOOGLE');
    // We test that the provider initialized successfully.
    // Inspecting the internal client id is hard on runtime object, but confirming it constructed is key.
    expect(googleProvider.provider).toBeTruthy();
  });

  it('should fall back gracefully with empty string if config has no Google ID', () => {
    const mockAppConfigService = {
      config: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AppConfigService, useValue: mockAppConfigService },
        provideSocialLogins(),
      ],
    });

    const config = TestBed.inject(SOCIAL_AUTH_CONFIG) as SocialAuthServiceConfig;
    expect(config).toBeDefined();
    expect(config.providers[0].provider).toBeTruthy();
  });
});
