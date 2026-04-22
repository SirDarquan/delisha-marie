import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

/**
 * A modern, Promise-based API service.
 * Standardizing on lastValueFrom for all HTTP interactions.
 */
@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);

  /**
   * Generic GET request returning the last emission as a Promise.
   */
  get<T>(url: string, options?: Record<string, unknown>): Promise<T> {
    return lastValueFrom(this.http.get<T>(url, options));
  }

  /**
   * Generic POST request returning the last emission as a Promise.
   */
  post<T>(url: string, body: unknown, options?: Record<string, unknown>): Promise<T> {
    return lastValueFrom(this.http.post<T>(url, body, options));
  }
}
