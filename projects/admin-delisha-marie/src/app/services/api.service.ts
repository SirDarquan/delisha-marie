import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  private formatUrl(url: string): string {
    const clean = url.startsWith('/') ? url : `/${url}`;
    return clean.startsWith('/api') ? clean : `/api${clean}`;
  }

  get<T>(url: string, options?: { headers?: unknown; params?: unknown }): Promise<T> {
    return lastValueFrom(
      this.http.get<T>(this.formatUrl(url), { ...options, withCredentials: true } as Record<
        string,
        unknown
      >),
    );
  }

  post<T>(
    url: string,
    body: unknown,
    options?: { headers?: unknown; params?: unknown },
  ): Promise<T> {
    return lastValueFrom(
      this.http.post<T>(this.formatUrl(url), body, { ...options, withCredentials: true } as Record<
        string,
        unknown
      >),
    );
  }

  put<T>(
    url: string,
    body: unknown,
    options?: { headers?: unknown; params?: unknown },
  ): Promise<T> {
    return lastValueFrom(
      this.http.put<T>(this.formatUrl(url), body, { ...options, withCredentials: true } as Record<
        string,
        unknown
      >),
    );
  }

  delete<T>(url: string, options?: { headers?: unknown; params?: unknown }): Promise<T> {
    return lastValueFrom(
      this.http.delete<T>(this.formatUrl(url), { ...options, withCredentials: true } as Record<
        string,
        unknown
      >),
    );
  }
}
