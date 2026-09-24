import { isDevMode } from '@angular/core';

export interface HomeUrlOptions {
  hostname?: string;
  isDev?: boolean;
}

/**
 * Returns the URL for navigating to the Home application or its subpages (e.g. /about, /contact).
 * In local development, routes to http://localhost:4220{path} (delisha-home dev server).
 * In production, routes to {path} on the root application domain.
 */
export function getHomeUrl(path = '', options?: HomeUrlOptions): string {
  const isDev = options?.isDev ?? isDevMode();
  const currentHost =
    options?.hostname ?? (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  if (!isLocal || !isDev) {
    return cleanPath || '/';
  }

  return `http://localhost:4220${cleanPath}`;
}
