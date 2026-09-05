import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { camelCaseKeys } from '@dm/library';
import { lastValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  private formatUrl(url: string): string {
    const clean = url.startsWith('/') ? url : `/${url}`;
    return clean.startsWith('/api') ? clean : `/api${clean}`;
  }

  private getOptions(options?: { headers?: unknown; params?: unknown }): Record<string, unknown> {
    return { ...options, withCredentials: true };
  }

  get<T>(url: string, options?: { headers?: unknown; params?: unknown }): Promise<T> {
    return lastValueFrom(
      this.http
        .get<T>(this.formatUrl(url), this.getOptions(options))
        .pipe(map((data) => camelCaseKeys(data))),
    );
  }

  post<T>(
    url: string,
    body: unknown,
    options?: { headers?: unknown; params?: unknown },
  ): Promise<T> {
    return lastValueFrom(
      this.http
        .post<T>(this.formatUrl(url), body, this.getOptions(options))
        .pipe(map((data) => camelCaseKeys(data))),
    );
  }

  put<T>(
    url: string,
    body: unknown,
    options?: { headers?: unknown; params?: unknown },
  ): Promise<T> {
    return lastValueFrom(
      this.http
        .put<T>(this.formatUrl(url), body, this.getOptions(options))
        .pipe(map((data) => camelCaseKeys(data))),
    );
  }

  delete<T>(url: string, options?: { headers?: unknown; params?: unknown }): Promise<T> {
    return lastValueFrom(
      this.http
        .delete<T>(this.formatUrl(url), this.getOptions(options))
        .pipe(map((data) => camelCaseKeys(data))),
    );
  }
}
