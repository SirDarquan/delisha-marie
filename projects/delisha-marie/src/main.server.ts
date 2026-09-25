import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';
import { ApplicationRef, isDevMode } from '@angular/core';
import { AppEx, appConfigEx } from './app/coming-soon';

let bootstrap: (context: BootstrapContext) => Promise<ApplicationRef>;
if (isDevMode()) {
  bootstrap = (context: BootstrapContext) => bootstrapApplication(AppEx, appConfigEx, context);
} else {
  bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);
}

export default bootstrap;
