import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, REQUEST, Service } from '@angular/core';

export interface CookieOptions {
  path?: string;
  maxAge?: number;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
}

@Service()
export class CookieService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });

  /**
   * Returns the raw cookie string from `document.cookie` on the browser
   * or from the incoming `REQUEST` `cookie` header during SSR.
   */
  getRawCookieString(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return this.document.cookie || null;
    }
    return this.getServerCookieHeader();
  }

  /**
   * Retrieves a single cookie value by name across browser or SSR.
   */
  get(name: string): string | null {
    const cookieString = this.getRawCookieString();
    if (!cookieString) {
      return null;
    }
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`).exec(cookieString);
    return match?.[1] ?? null;
  }

  /**
   * Sets a cookie on `document.cookie` when running in the browser.
   */
  set(name: string, value: string, options?: CookieOptions): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const path = options?.path ?? '/';
    const sameSite = options?.sameSite ?? 'Lax';
    let cookie = `${name}=${value}; path=${path}`;

    if (options?.maxAge !== undefined) {
      cookie += `; max-age=${options.maxAge}`;
    }

    cookie += `; SameSite=${sameSite}`;

    if (options?.secure) {
      cookie += '; Secure';
    }

    this.document.cookie = cookie;
  }

  private getServerCookieHeader(): string | null {
    if (!this.request || typeof this.request !== 'object') {
      return null;
    }
    const reqObj = this.request as {
      headers?: Headers | Record<string, string | string[] | undefined>;
    };
    if (!reqObj.headers) {
      return null;
    }
    if (typeof (reqObj.headers as Headers).get === 'function') {
      return (reqObj.headers as Headers).get('cookie');
    }
    const dict = reqObj.headers as Record<string, string | string[] | undefined>;
    const val = dict['cookie'] ?? dict['Cookie'];
    if (Array.isArray(val)) {
      return val.join('; ');
    }
    return val || null;
  }
}
