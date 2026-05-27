import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideSocialLogins } from './provider/social-logins';
import { provideDescope } from './provider/descope';
import { PluginRegistry } from '../core/plugins/plugin-registry.services';
import { provideAppConfig } from './services/config.service';
import { BRAND_TITLE_TOKEN } from './pages/auth/auth-shared.utils';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(PluginRegistry).initAll()),
    provideAppConfig(),
    provideSocialLogins(),
    provideDescope(),
    { provide: BRAND_TITLE_TOKEN, useValue: 'Delisha Marie' },
  ],
};
