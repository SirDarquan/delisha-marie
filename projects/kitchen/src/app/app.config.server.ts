import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  mergeApplicationConfig,
  provideAppInitializer,
} from '@angular/core';
import { provideServerRendering, withAppShell, withRoutes } from '@angular/ssr';
import { DEFAULT_SSR_PORT, PluginRegistry, vercelAbsoluteUrlInterceptor } from '@dm/library';
import { AppShell } from './app-shell/app-shell';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes), withAppShell(AppShell)),
    provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
    { provide: DEFAULT_SSR_PORT, useValue: '4201' },
    provideAppInitializer(() => inject(PluginRegistry).initAll(true)),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
