import { TestBed } from '@angular/core/testing';
import { DescopeAuthConfig } from '@descope/angular-sdk';
import { provideDescope } from './descope';
import { AppConfigService } from '../services/config.service';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';

describe('Descope Provider', () => {
  it('should resolve DescopeAuthConfig dynamically from AppConfigService', () => {
    const mockConfig = {
      DescopeProjectId: 'mock-descope-project-id',
    };

    const mockAppConfigService = {
      config: signal(mockConfig),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AppConfigService, useValue: mockAppConfigService }, provideDescope()],
    });

    const resolvedConfig = TestBed.inject(DescopeAuthConfig);

    expect(resolvedConfig).toBeDefined();
    expect(resolvedConfig.projectId).toBe('mock-descope-project-id');
  });

  it('should fall back gracefully to default projectId if config is empty', () => {
    const mockAppConfigService = {
      config: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AppConfigService, useValue: mockAppConfigService }, provideDescope()],
    });

    const resolvedConfig = TestBed.inject(DescopeAuthConfig);
    expect(resolvedConfig).toBeDefined();
    expect(resolvedConfig.projectId).toBe('');
  });
});
