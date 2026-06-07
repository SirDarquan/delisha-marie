import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideDescope } from './provider/descope';
import { PluginRegistry } from '../core/plugins/plugin-registry.services';
import { provideAppConfig } from './services/config.service';
import { BRAND_TITLE_TOKEN } from './pages/auth/auth-shared.utils';

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
