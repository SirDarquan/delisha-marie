import { HttpClient } from '@angular/common/http';
import { Injectable, inject, TransferState, makeStateKey } from '@angular/core';
import { lastValueFrom, tap } from 'rxjs';

/**
 * A modern, Promise-based API service.
 * Standardizing on lastValueFrom for all HTTP interactions.
 */
@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);

  private readonly normalizeUrl = (url: string): string => `/api${url}`;

  /**
   * Generic GET request returning the last emission as a Promise.
   * Uses TransferState to pass SSR-fetched data to the browser seamlessly,
   * avoiding URL mismatch issues caused by absolute URL interceptors.
   */
  get<T>(url: string, options?: Record<string, unknown>): Promise<T> {
    const normalized = this.normalizeUrl(url);
    const key = makeStateKey<T>(`API_GET_${normalized}`);

    if (this.transferState.hasKey(key)) {
      const cached = this.transferState.get(key, null as T);
      this.transferState.remove(key);
      return Promise.resolve(cached);
    }

    return lastValueFrom(
      this.http.get<T>(normalized, options).pipe(tap((data) => this.transferState.set(key, data))),
    );
  }

  /**
   * Generic POST request returning the last emission as a Promise.
   */
  post<T>(url: string, body: unknown, options?: Record<string, unknown>): Promise<T> {
    return lastValueFrom(this.http.post<T>(this.normalizeUrl(url), body, options));
  }
}
