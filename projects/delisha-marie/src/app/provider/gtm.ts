import { Provider, inject } from '@angular/core';
import { AppConfigService } from '../services/config.service';

export function provideGtm(): Provider[] {
  return [
    {
      provide: 'googleTagManagerId',
      useFactory: () => inject(AppConfigService).GoogleTagManagerConfig()?.id || null,
    },
    {
      provide: 'googleTagManagerAuth',
      useFactory: () => inject(AppConfigService).GoogleTagManagerConfig()?.gtm_auth || '',
    },
    {
      provide: 'googleTagManagerPreview',
      useFactory: () => inject(AppConfigService).GoogleTagManagerConfig()?.gtm_preview || '',
    },
    {
      provide: 'googleTagManagerResourcePath',
      useFactory: () => inject(AppConfigService).GoogleTagManagerConfig()?.gtm_resource_path || '',
    },
    {
      provide: 'googleTagManagerCSPNonce',
      useFactory: () => inject(AppConfigService).GoogleTagManagerConfig()?.gtm_csp_none || '',
    },
    {
      provide: 'googleTagManagerMode',
      useFactory: () => inject(AppConfigService).GoogleTagManagerConfig()?.gtm_mode || 'noisy',
    },
  ];
}
