import { inject, Provider } from '@angular/core';
import { DescopeAuthConfig } from '@descope/angular-sdk';
import { AppConfigService } from '../services/config.service';

export function provideDescope(): Provider {
  return {
    provide: DescopeAuthConfig,
    useFactory: () => {
      const appConfigService = inject(AppConfigService);
      return {
        get projectId(): string {
          return appConfigService.DescopeProjectId() || '';
        },
      } as DescopeAuthConfig;
    },
  };
}
