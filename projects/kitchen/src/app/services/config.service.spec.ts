import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_PLUGINS } from '@dm/library';
import { PLATFORM_ID, TransferState } from '@angular/core';
import { APP_CONFIG_STATE_KEY, AppConfig, AppConfigService } from './config.service';
import { provideAppConfig } from '../provider/app-config';

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
    expect(service.config()).toBeNull();
  });

  it('should fetch configuration from /config and populate signal state', async () => {
    const mockConfig: AppConfig = {
      GoogleTagManager: {
        id: 'GTM-M73DF5VL',
        gtm_auth: 'auth-123',
        gtm_preview: 'preview-456',
        gtm_resource_path: 'test-path',
        gtm_csp_none: 'nonce-789',
        gtm_mode: 'silent',
      },
    };

    const promise = service.init();

    const req = httpMock.expectOne('/config');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    await promise;

    expect(service.config()).toEqual(mockConfig);
  });

  it('should use TransferState cached config if available and skip HTTP request', async () => {
    const transferState = TestBed.inject(TransferState);
    const mockConfig: AppConfig = {
      GoogleTagManager: {
        id: 'GTM-CACHED',
      },
    };
    transferState.set(APP_CONFIG_STATE_KEY, mockConfig);

    await service.init();

    httpMock.expectNone('/config');
    expect(service.config()).toEqual(mockConfig);
    expect(transferState.hasKey(APP_CONFIG_STATE_KEY)).toBe(false);
  });

  it('should initialize config directly from process.env on server platform (SSR)', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AppConfigService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const serverService = TestBed.inject(AppConfigService);
    const serverTransferState = TestBed.inject(TransferState);
    const serverHttpMock = TestBed.inject(HttpTestingController);

    const origGtm = process.env['GTM_ID'];
    const origSentry = process.env['SENTRY_DSN'];
    const origFeatured = process.env['KITCHEN_FEATURED_RECIPES'];
    process.env['GTM_ID'] = 'GTM-SERVER-1';
    process.env['SENTRY_DSN'] = 'https://sentry-server';
    process.env['KITCHEN_FEATURED_RECIPES'] = 'recipe-1, recipe-2';

    await serverService.init();

    serverHttpMock.expectNone('/config');
    expect(serverService.config()?.GoogleTagManager.id).toBe('GTM-SERVER-1');
    expect(serverService.config()?.Sentry?.dsn).toBe('https://sentry-server');
    expect(serverService.config()?.KitchenHome?.featuredRecipes).toEqual(['recipe-1', 'recipe-2']);
    expect(serverTransferState.hasKey(APP_CONFIG_STATE_KEY)).toBe(true);

    if (origGtm !== undefined) {
      process.env['GTM_ID'] = origGtm;
    } else {
      delete process.env['GTM_ID'];
    }
    if (origSentry !== undefined) {
      process.env['SENTRY_DSN'] = origSentry;
    } else {
      delete process.env['SENTRY_DSN'];
    }
    if (origFeatured !== undefined) {
      process.env['KITCHEN_FEATURED_RECIPES'] = origFeatured;
    } else {
      delete process.env['KITCHEN_FEATURED_RECIPES'];
    }
  });

  it('should log and throw a critical error if backend load fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    const promise = service.init();

    const req = httpMock.expectOne('/config');
    req.flush('Network Error', { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    expect(service.config()).toBeNull();

    consoleSpy.mockRestore();
  });
  it('should return GoogleTagManagerConfig', () => {
    service.config.set({ GoogleTagManager: { id: 'GTM-123' } } as AppConfig);
    expect(service.GoogleTagManagerConfig()).toEqual({ id: 'GTM-123' });
    service.config.set(null);
    expect(service.GoogleTagManagerConfig()).toBeUndefined();
  });

  it('should return SentryConfig', () => {
    service.config.set({ Sentry: { dsn: 'test-dsn' } } as AppConfig);
    expect(service.SentryConfig()).toEqual({ dsn: 'test-dsn' } as AppConfig['Sentry']);
    service.config.set(null);
    expect(service.SentryConfig()).toBeUndefined();
  });

  it('should return KitchenHomeConfig', () => {
    const kitchenHomeMock = {
      featuredRecipes: ['/r/1', '/r/2', '/r/3'],
      kitchen_about: 'pic1.png',
      sidebar_about: 'pic2.png',
    };
    service.config.set({ KitchenHome: kitchenHomeMock } as AppConfig);
    expect(service.KitchenHomeConfig()).toEqual(kitchenHomeMock);
    service.config.set(null);
    expect(service.KitchenHomeConfig()).toBeUndefined();
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
