import { InjectionToken } from '@angular/core';

export interface AppPlugin {
  readonly id: string;
  readonly order?: number;
  isEnabled?(): boolean;
  init(): void | Promise<void>;
}

export const APP_PLUGINS = new InjectionToken<AppPlugin[]>('app-plugins');
