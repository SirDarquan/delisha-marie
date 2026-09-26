import { bootstrapApplication } from '@angular/platform-browser';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { initBotId } from 'botid/client/core';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { AppEx, appConfigEx, isLive } from './app/coming-soon';

const live = await isLive();
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
