import { isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import type { Comment } from '@dm/library';
import { EMPTY, Observable } from 'rxjs';

export interface CommentStreamEvent {
  comment?: Comment;
  stats?: {
    reviewCount: number;
    ratingCount: number;
    rating: number;
  };
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommentStreamService {
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  getCommentStream(recipeId: string | number): Observable<CommentStreamEvent> {
    if (!this.isBrowser || typeof EventSource === 'undefined') {
      return EMPTY;
    }

    return new Observable<CommentStreamEvent>((observer) => {
      let eventSource: EventSource | null = null;

      try {
        eventSource = new EventSource(`/api/recipes/${recipeId}/comments/stream`);

        eventSource.onmessage = (event: MessageEvent) => {
          this.ngZone.run(() => {
            try {
              const data = JSON.parse(event.data) as CommentStreamEvent;
              observer.next(data);
            } catch {
              // Ignore unparseable frames (e.g. heartbeat)
            }
          });
        };

        eventSource.onerror = (err) => {
          this.ngZone.run(() => {
            observer.error(err);
          });
        };
      } catch (err) {
        this.ngZone.run(() => {
          observer.error(err);
        });
      }

      return () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    });
  }
}
