import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withAppShell, withRoutes } from '@angular/ssr';
import { AppShell } from './app-shell/app-shell';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes), withAppShell(AppShell)),
    provideHttpClient(withInterceptors([])), // vercelAbsoluteUrlInterceptor
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
