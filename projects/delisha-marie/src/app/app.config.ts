import { provideImageKitLoader } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideExperimentalWebMcpTools,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { PluginRegistry } from '@dm/library';
import { routes } from './app.routes';
import { provideAppConfig } from './provider/app-config';
import { provideGtm } from './provider/tag-manager';
import { TemplatePageTitleStrategy, provideTitleStrategy } from './services/title.strategy';
import { withRecipes } from './webmcp';
import { provideSentry } from './provider/sentry';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideTitleStrategy(TemplatePageTitleStrategy),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([])),
    provideExperimentalWebMcpTools(withRecipes()),
    provideImageKitLoader('https://ik.imagekit.io/delishamarie'),
    provideAppInitializer(() => inject(PluginRegistry).initAll()),
    provideAppConfig(),
    provideGtm(),
    provideSentry(),
  ],
};
