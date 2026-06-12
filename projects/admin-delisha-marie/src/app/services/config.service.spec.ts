import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_PLUGINS } from '../../core/plugins/plugin.token';
import { AppConfig, AppConfigService, provideAppConfig } from './config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AppConfigService],
    });

    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created with default state', () => {
    expect(service).toBeTruthy();
    expect(service.id).toBe('AppConfigService');
    expect(service.order).toBe(1);
    expect(service.SocialClients()).toBeUndefined();
    expect(service.DescopeProjectId()).toBeUndefined();
  });

  it('should fetch configuration from /config and populate signal state', async () => {
    const mockConfig: AppConfig = {
      SocialClients: { GoogleClientId: 'test-google-123' },
      DescopeProjectId: 'test-descope-456',
    };

    const promise = service.init();

    const req = httpMock.expectOne('/config');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    await promise;

    expect(service.SocialClients()).toEqual(mockConfig.SocialClients);
    expect(service.DescopeProjectId()).toBe('test-descope-456');
  });

  it('should log and throw a critical error if backend load fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    const promise = service.init();

    const req = httpMock.expectOne('/config');
    req.flush('Network Error', { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    expect(service.SocialClients()).toBeUndefined();
    expect(service.DescopeProjectId()).toBeUndefined();

    consoleSpy.mockRestore();
  });

  describe('provideAppConfig', () => {
    it('should return valid plugin token provider definition', () => {
      const providers = provideAppConfig();
      expect(providers).toHaveLength(1);
      expect(providers[0].provide).toBe(APP_PLUGINS);
      expect(providers[0].useExisting).toBe(AppConfigService);
      expect(providers[0].multi).toBe(true);
    });
  });
});
