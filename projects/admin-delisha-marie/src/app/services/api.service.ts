import { Injectable, inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  private formatUrl(url: string): string {
    const clean = url.startsWith('/') ? url : `/${url}`;
    return clean.startsWith('/api') ? clean : `/api${clean}`;
  }

  private getOptions(options?: { headers?: unknown; params?: unknown }): Record<string, unknown> {
    const opts: Record<string, unknown> = { ...options, withCredentials: true };
    if (!isPlatformBrowser(this.platformId) && this.request) {
      const cookie = this.request.headers.get('cookie');
      if (cookie) {
        opts['headers'] = new HttpHeaders({
          ...(opts['headers'] as Record<string, string | string[]>),
          cookie: cookie,
        });
      }
    }
    return opts;
  }

  get<T>(url: string, options?: { headers?: unknown; params?: unknown }): Promise<T> {
    return lastValueFrom(this.http.get<T>(this.formatUrl(url), this.getOptions(options)));
  }

  post<T>(
    url: string,
    body: unknown,
    options?: { headers?: unknown; params?: unknown },
  ): Promise<T> {
    return lastValueFrom(this.http.post<T>(this.formatUrl(url), body, this.getOptions(options)));
  }

  put<T>(
    url: string,
    body: unknown,
    options?: { headers?: unknown; params?: unknown },
  ): Promise<T> {
    return lastValueFrom(this.http.put<T>(this.formatUrl(url), body, this.getOptions(options)));
  }

  delete<T>(url: string, options?: { headers?: unknown; params?: unknown }): Promise<T> {
    return lastValueFrom(this.http.delete<T>(this.formatUrl(url), this.getOptions(options)));
  }
}
