import { TestBed } from '@angular/core/testing';
import { DescopeAuthConfig } from '@descope/angular-sdk';
import { describe, expect, it } from 'vitest';
import { AppConfigService } from '../services/config.service';
import { provideDescope } from './descope';

describe('Descope Provider', () => {
  it('should resolve DescopeAuthConfig dynamically from AppConfigService', () => {
    const mockAppConfigService = {
      DescopeProjectId: () => 'mock-descope-project-id',
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
      DescopeProjectId: () => undefined,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AppConfigService, useValue: mockAppConfigService }, provideDescope()],
    });

    const resolvedConfig = TestBed.inject(DescopeAuthConfig);
    expect(resolvedConfig).toBeDefined();
    expect(resolvedConfig.projectId).toBe('');
  });
});
