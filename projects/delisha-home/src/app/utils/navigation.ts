import { isDevMode } from '@angular/core';

export interface KitchenUrlOptions {
  hostname?: string;
  isDev?: boolean;
}

/**
 * Returns the URL for navigating to the Kitchen application.
 * In local development, routes to http://localhost:4200 (delisha-marie dev server).
 * In production, routes to /kitchen.
 */
export function getKitchenUrl(options?: KitchenUrlOptions): string {
  const isDev = options?.isDev ?? isDevMode();
  const currentHost =
    options?.hostname ?? (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';

  if (!isLocal || !isDev) {
    return '/kitchen';
  }

  return 'http://localhost:4200';
}
