import { bootstrapApplication } from '@angular/platform-browser';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { initBotId } from 'botid/client/core';
import { isDevMode } from '@angular/core';
import { AppEx, appConfigEx, isKitchenReleased } from './app/coming-soon';

const isReleased = await isKitchenReleased();

let live = false;
if (
  isDevMode() ||
  location.hostname.endsWith('vercel.app') ||
  (location.pathname.startsWith('/kitchen') && isReleased)
) {
  live = true;
}
console.log({
  isDevMode: isDevMode(),
  preview: location.hostname.endsWith('vercel.app'),
  live: location.hostname.endsWith('delisha-marie.com'),
});

if (!live) {
  bootstrapApplication(AppEx, appConfigEx).catch((err) => console.error(err));
} else {
  inject();
  injectSpeedInsights();
  initBotId({
    protect: [
      {
        path: '/api/subscriber',
        method: 'POST',
      },
      {
        path: '/api/recipes/*/comments',
        method: 'POST',
      },
    ],
  });
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
