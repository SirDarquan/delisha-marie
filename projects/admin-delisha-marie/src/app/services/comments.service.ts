import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Comment {
  id: string;
  recipe_id: string;
  parent_id: string | null;
  author: string;
  email: string | null;
  content: string;
  is_admin: boolean;
  status: 'approved' | 'pending' | 'spam' | 'skipped';
  created_at: string;
  is_new: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  getComments(recipeId: string): Observable<{ comments: Comment[] }> {
    return this.http.get<{ comments: Comment[] }>(`${this.apiUrl}/recipes/${recipeId}/comments`, {
      withCredentials: true,
    });
  }

  replyToComment(recipeId: string, parentId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiUrl}/recipes/${recipeId}/comments/${parentId}/reply`,
      { content },
      { withCredentials: true },
    );
  }

  deleteComment(recipeId: string, id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/recipes/${recipeId}/comments/${id}`,
      { withCredentials: true },
    );
  }

  skipComment(recipeId: string, id: string, skipped: boolean): Observable<Comment> {
    return this.http.patch<Comment>(
      `${this.apiUrl}/recipes/${recipeId}/comments/${id}/skip`,
      { skipped },
      { withCredentials: true },
    );
  }
}
