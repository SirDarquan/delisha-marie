import {
  SOCIAL_AUTH_CONFIG,
  GoogleLoginProvider,
  SocialAuthServiceConfig,
} from '@abacritt/angularx-social-login';
import { inject, Provider } from '@angular/core';
import { AppConfigService } from '../services/config.service';

export interface SocialClients {
  GoogleClientId?: string;
  AmazonClientId?: string;
  FacebookClientId?: string;
  VKClientId?: string;
  MicrosoftClientId?: string;
}

export function provideSocialLogins(): Provider {
  return {
    provide: SOCIAL_AUTH_CONFIG,
    useFactory: () => {
      const appConfigService = inject(AppConfigService);
      const clients = appConfigService.config()?.SocialClients;

      return {
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(clients?.GoogleClientId || '', {
              oneTapEnabled: false,
            }),
          },
        ],
      } as SocialAuthServiceConfig;
    },
  };
}
