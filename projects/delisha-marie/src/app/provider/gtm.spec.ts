import { ProviderToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '../services/config.service';
import { provideGtm } from './gtm';

import { vi } from 'vitest';

describe('provideGtm', () => {
  let mockConfigService: {
    GoogleTagManagerConfig: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockConfigService = {
      GoogleTagManagerConfig: vi.fn().mockReturnValue({
        id: 'GTM-TEST-123',
        gtm_auth: 'auth-123',
        gtm_preview: 'preview-456',
        gtm_resource_path: 'test-path',
        gtm_csp_none: 'nonce-789',
        gtm_mode: 'silent',
      }),
    };

    TestBed.configureTestingModule({
      providers: [provideGtm(), { provide: AppConfigService, useValue: mockConfigService }],
    });
  });

  it('should provide googleTagManagerId correctly', () => {
    const id = TestBed.inject('googleTagManagerId' as unknown as ProviderToken<string>);
    expect(id).toBe('GTM-TEST-123');
  });

  it('should provide googleTagManagerAuth correctly', () => {
    const auth = TestBed.inject('googleTagManagerAuth' as unknown as ProviderToken<string>);
    expect(auth).toBe('auth-123');
  });

  it('should provide googleTagManagerPreview correctly', () => {
    const preview = TestBed.inject('googleTagManagerPreview' as unknown as ProviderToken<string>);
    expect(preview).toBe('preview-456');
  });

  it('should provide googleTagManagerResourcePath correctly', () => {
    const resourcePath = TestBed.inject(
      'googleTagManagerResourcePath' as unknown as ProviderToken<string>,
    );
    expect(resourcePath).toBe('test-path');
  });

  it('should provide googleTagManagerCSPNonce correctly', () => {
    const cspNonce = TestBed.inject('googleTagManagerCSPNonce' as unknown as ProviderToken<string>);
    expect(cspNonce).toBe('nonce-789');
  });

  it('should provide googleTagManagerMode correctly', () => {
    const mode = TestBed.inject('googleTagManagerMode' as unknown as ProviderToken<string>);
    expect(mode).toBe('silent');
  });

  it('should handle null or undefined config gracefully', () => {
    mockConfigService.GoogleTagManagerConfig.mockReturnValue(null);
    const id = TestBed.inject('googleTagManagerId' as unknown as ProviderToken<string>);
    expect(id).toBeNull();

    const auth = TestBed.inject('googleTagManagerAuth' as unknown as ProviderToken<string>);
    expect(auth).toBe('');
  });
});
