import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PluginRegistry } from '@dm/library';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { BRAND_TITLE_TOKEN } from './pages/auth/auth-shared.utils';
import { provideDescope } from './provider/descope';
import { provideAppConfig } from './provider/app-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(PluginRegistry).initAll()),
    provideAppConfig(),
    provideDescope(),
    { provide: BRAND_TITLE_TOKEN, useValue: 'Delisha Marie' },
  ],
};
