import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Comment, CommentsService } from '../../services/comments.service';
import { RecipeReplyFormComponent } from './recipe-reply-form';

@Component({
  selector: 'app-recipe-comments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    RecipeReplyFormComponent,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="flex items-center mb-6">
        <a mat-icon-button routerLink="/recipes" class="mr-4">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1 class="text-3xl font-bold m-0">Review Comments</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center p-12">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (error()) {
        <div class="bg-red-50 text-red-600 p-4 rounded-lg">
          {{ error() }}
        </div>
      } @else if (visibleComments().length === 0) {
        <div class="text-center p-12 text-gray-500">No new comments found for this recipe.</div>
      } @else {
        <div class="space-y-6">
          @for (comment of visibleComments(); track comment.id) {
            <mat-card
              class="overflow-hidden !bg-slate-900 !border !border-slate-800 shadow-xl rounded-xl">
              <mat-card-header class="pt-5 px-5 pb-2">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                  <div class="flex items-center gap-3">
                    <span class="font-bold text-lg text-purple-400">{{ comment.author }}</span>
                    @if (isNew(comment)) {
                      <mat-chip
                        class="!bg-purple-500/20 !text-purple-300 border border-purple-500/30 font-bold tracking-widest text-[10px]"
                        style="min-height: 24px; padding: 0 8px;"
                        >NEW</mat-chip
                      >
                    }
                  </div>
                  <span class="text-sm text-slate-400 mt-1 sm:mt-0">{{
                    comment.created_at | date: 'medium'
                  }}</span>
                </div>
              </mat-card-header>
              <mat-card-content class="p-5">
                <p class="text-slate-300 whitespace-pre-wrap text-base leading-relaxed mb-4">
                  {{ comment.content }}
                </p>

                <!-- Thread/Replies -->
                @if (getReplies(comment.id).length > 0) {
                  <div class="mt-4 pl-4 border-l-2 border-slate-800 space-y-4">
                    @for (reply of getReplies(comment.id); track reply.id) {
                      <div
                        class="bg-slate-800 border border-slate-700/50 p-4 rounded-xl"
                        [class.border-purple-500/30]="reply.author === 'Delisha Marie'">
                        <div
                          class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                          <div class="flex items-center gap-2">
                            <span
                              class="font-bold text-sm text-slate-200"
                              [class.!text-purple-400]="reply.author === 'Delisha Marie'"
                              >{{ reply.author }}</span
                            >
                            @if (reply.author === 'Delisha Marie') {
                              <mat-icon class="text-purple-500 text-sm h-4 w-4">verified</mat-icon>
                            }
                          </div>
                          <span class="text-xs text-slate-400 mt-1 sm:mt-0">{{
                            reply.created_at | date: 'medium'
                          }}</span>
                        </div>
                        <p class="text-sm whitespace-pre-wrap text-slate-300">
                          {{ reply.content }}
                        </p>
                      </div>
                    }
                  </div>
                }

                <!-- Actions -->
                <div class="mt-6 flex gap-3">
                  @if (!replying()[comment.id]) {
                    <button mat-stroked-button color="accent" (click)="openReply(comment.id)">
                      Reply
                    </button>
                    <button
                      mat-button
                      color="warn"
                      class="opacity-80 hover:opacity-100"
                      (click)="skipComment(comment.id)">
                      Skip
                    </button>
                  } @else {
                    <app-recipe-reply-form
                      class="w-full"
                      [recipeId]="recipeId()"
                      [parentId]="comment.id"
                      (canceled)="cancelReply(comment.id)"
                      (success)="onReplySuccess(comment.id, $event)">
                    </app-recipe-reply-form>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [],
})
export class RecipeCommentsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly commentsService = inject(CommentsService);
  private readonly snackBar = inject(MatSnackBar);

  recipeId = signal<string>('');
  comments = signal<Comment[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // State
  replying = signal<Record<string, boolean>>({});
  undoingSkip = signal<Record<string, boolean>>({});

  topLevelComments = computed(() => {
    return this.comments().filter((c) => !c.parent_id);
  });

  visibleComments = computed(() => {
    return this.topLevelComments().filter(
      (c) => (this.isNew(c) && c.status !== 'skipped') || this.undoingSkip()[c.id],
    );
  });

  private readonly _routeSub = this.route.paramMap.subscribe((params) => {
    const id = params.get('id');
    if (id) {
      this.recipeId.set(id);
      this.loadComments(id);
    }
  });

  loadComments(id: string) {
    this.loading.set(true);
    this.commentsService.getComments(id).subscribe({
      next: (res) => {
        this.comments.set(res.comments);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to load comments');
        this.loading.set(false);
      },
    });
  }

  getReplies(parentId: string): Comment[] {
    return this.comments().filter((c) => c.parent_id === parentId);
  }

  isNew(comment: Comment): boolean {
    return comment.is_new === true;
  }

  openReply(id: string) {
    this.replying.update((r) => ({ ...r, [id]: true }));
  }

  cancelReply(id: string) {
    this.replying.update((r) => ({ ...r, [id]: false }));
  }

  onReplySuccess(parentId: string, newReply: Comment) {
    const prevParentIsNew = this.comments().find((c) => c.id === parentId)?.is_new;
    this.comments.update((comments) => {
      const added = [...comments, newReply];
      return added.map((c) => (c.id === parentId ? { ...c, is_new: false } : c));
    });
    this.replying.update((r) => ({ ...r, [parentId]: false }));

    const snackRef = this.snackBar.open('The message has been sent', 'Undo', {
      duration: 30000,
    });

    snackRef.onAction().subscribe(() => {
      // Undo reply
      this.commentsService.deleteComment(this.recipeId(), newReply.id).subscribe({
        next: () => {
          this.comments.update((comments) => {
            const filtered = comments.filter((c) => c.id !== newReply.id);
            return filtered.map((c) =>
              c.id === parentId ? { ...c, is_new: prevParentIsNew ?? true } : c,
            );
          });
          this.replying.update((r) => ({ ...r, [parentId]: true }));
        },
        error: () => {
          this.snackBar.open('Failed to undo reply', 'Close', { duration: 3000 });
        },
      });
    });
  }

  async skipComment(id: string) {
    const prevStatus = this.comments().find((c) => c.id === id)?.status;
    const prevIsNew = this.comments().find((c) => c.id === id)?.is_new;

    // Optimistically update
    this.comments.update((comments) =>
      comments.map((c) => (c.id === id ? { ...c, status: 'skipped', is_new: false } : c)),
    );

    try {
      await firstValueFrom(this.commentsService.skipComment(this.recipeId(), id, true));

      const snackRef = this.snackBar.open('This comment was skipped', 'Undo', {
        duration: 10000,
      });

      snackRef.onAction().subscribe(async () => {
        try {
          await firstValueFrom(this.commentsService.skipComment(this.recipeId(), id, false));
          this.comments.update((comments) =>
            comments.map((c) =>
              c.id === id
                ? { ...c, status: prevStatus || 'approved', is_new: prevIsNew ?? true }
                : c,
            ),
          );
        } catch {
          this.snackBar.open('Failed to undo skip', 'Close', { duration: 3000 });
        }
      });
    } catch {
      // Revert on error
      this.comments.update((comments) =>
        comments.map((c) =>
          c.id === id ? { ...c, status: prevStatus || 'approved', is_new: prevIsNew ?? true } : c,
        ),
      );
      this.snackBar.open('Failed to skip comment', 'Close', { duration: 3000 });
    }
  }
}
