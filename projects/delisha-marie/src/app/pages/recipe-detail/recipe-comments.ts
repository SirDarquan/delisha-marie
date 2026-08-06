import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  resource,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Stars } from '@dm/library';
import { NgxPaginationModule } from 'ngx-pagination';
import { WINDOW } from '../../services/global-tokens';
import { Comment, Recipe, RecipeService } from '../../services/recipe.service';

export interface CommentFormValue {
  author: string;
  email: string;
  website: string;
  content: string;
  rating: number | null;
  alt_email: string;
  isNew: boolean;
}

@Component({
  selector: 'dml-recipe-comments',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormField,
    FormRoot,
    NgxPaginationModule,
    MatIconModule,
    MatButtonModule,
    Stars,
    RouterLink,
  ],
  template: `
    <div class="recipe-comments mt-20 scroll-mt-28" id="comments">
      <!-- Comments Header -->
      <div class="flex items-center gap-4 mb-10">
        <h2 class="text-3xl font-black tracking-tight">
          {{ totalTopLevelComments() }} comment(s) on '{{ recipe().title }}'
        </h2>
        <div class="h-px flex-1 bg-[var(--mat-sys-outline-variant)] opacity-30"></div>
      </div>

      <!-- Comment Form -->
      <div
        class="bg-[var(--mat-sys-surface-container-low)] rounded-[2.5rem] p-6 sm:p-8 md:p-12 border-y sm:border border-[var(--mat-sys-outline-variant)] mb-16 scroll-mt-28"
        id="respond">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-2xl font-black">
            {{ replyTo() ? 'Reply to ' + replyTo()?.author : 'Leave a Comment' }}
          </h3>
          @if (replyTo()) {
            <button mat-button (click)="cancelReply()" class="text-[var(--mat-sys-primary)]">
              Cancel Reply
            </button>
          }
        </div>

        <form [formRoot]="commentForm" class="space-y-6">
          <div class="hidden" aria-hidden="true" style="display: none;">
            <input
              type="text"
              id="alt_email"
              [formField]="commentForm.alt_email"
              tabindex="-1"
              autocomplete="off" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <label
                for="author"
                class="text-xs font-black uppercase tracking-widest opacity-50 ml-2"
                >Name *</label
              >
              <input
                type="text"
                id="author"
                [formField]="commentForm.author"
                placeholder="Your Name"
                class="w-full h-14 px-6 rounded-2xl bg-[var(--mat-sys-surface-container-high)] border-transparent focus:border-[var(--mat-sys-primary)] focus:ring-0 transition-all font-medium" />
              @if (commentForm.author().invalid() && commentForm.author().touched()) {
                <span class="text-xs text-[var(--mat-sys-error)] ml-2">{{
                  commentForm.author().errors()?.[0]?.message
                }}</span>
              }
            </div>

            <div class="space-y-1">
              <label
                for="email"
                class="text-xs font-black uppercase tracking-widest opacity-50 ml-2"
                >Email *</label
              >
              <input
                type="email"
                id="email"
                [formField]="commentForm.email"
                placeholder="email@example.com"
                class="w-full h-14 px-6 rounded-2xl bg-[var(--mat-sys-surface-container-high)] border-transparent focus:border-[var(--mat-sys-primary)] focus:ring-0 transition-all font-medium" />
              @if (commentForm.email().invalid() && commentForm.email().touched()) {
                <span class="text-xs text-[var(--mat-sys-error)] ml-2">{{
                  commentForm.email().errors()?.[0]?.message
                }}</span>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <label
                for="website"
                class="text-xs font-black uppercase tracking-widest opacity-50 ml-2"
                >Website (Optional)</label
              >
              <input
                type="url"
                id="website"
                [formField]="commentForm.website"
                placeholder="https://yourblog.com"
                class="w-full h-14 px-6 rounded-2xl bg-[var(--mat-sys-surface-container-high)] border-transparent focus:border-[var(--mat-sys-primary)] focus:ring-0 transition-all font-medium" />
            </div>

            @if (!replyTo()) {
              <div class="space-y-1">
                <span class="text-xs font-black uppercase tracking-widest opacity-50 ml-2"
                  >Rating (Optional)</span
                >
                <div class="h-14 flex items-center px-6">
                  <dml-stars
                    [rating]="commentForm.rating().value() ?? 0"
                    [interactive]="true"
                    (ratingChange)="setRating($event)" />
                </div>
              </div>
            }
          </div>

          <div class="space-y-1">
            <label
              for="content"
              class="text-xs font-black uppercase tracking-widest opacity-50 ml-2"
              >Comment *</label
            >
            <textarea
              id="content"
              [formField]="commentForm.content"
              rows="5"
              placeholder="Share your thoughts..."
              class="w-full p-6 rounded-2xl bg-[var(--mat-sys-surface-container-high)] border-transparent focus:border-[var(--mat-sys-primary)] focus:ring-0 transition-all font-medium resize-none"></textarea>
            @if (commentForm.content().invalid() && commentForm.content().touched()) {
              <span class="text-xs text-[var(--mat-sys-error)] ml-2">{{
                commentForm.content().errors()?.[0]?.message
              }}</span>
            }
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              mat-flat-button
              class="h-14 px-10 rounded-full text-lg font-bold"
              [disabled]="commentForm().invalid() || commentForm().submitting() || loading()">
              {{
                commentForm().submitting()
                  ? 'Posting...'
                  : replyTo()
                    ? 'Post Reply'
                    : 'Post Comment'
              }}
            </button>
          </div>
        </form>
      </div>

      <!-- Comments List -->
      <div class="space-y-8">
        @if (loading() && comments().length === 0) {
          <div class="flex flex-col gap-8">
            @for (i of [1, 2, 3]; track i) {
              <div
                class="h-32 rounded-3xl bg-[var(--mat-sys-surface-container-high)] animate-pulse"></div>
            }
          </div>
        } @else if (comments().length === 0) {
          <div
            class="text-center py-16 bg-[var(--mat-sys-surface-container-low)] rounded-[2.5rem] border border-[var(--mat-sys-outline-variant)] border-opacity-50">
            <p class="text-2xl font-black text-[var(--mat-sys-on-surface-variant)] opacity-50">
              Be the first to comment!
            </p>
          </div>
        } @else {
          <!-- Register with ngx-pagination internally -->
          <div style="display: none">
            @for (
              c of topLevelComments()
                | paginate
                  : {
                      itemsPerPage: pageSize(),
                      currentPage: currentPage(),
                      totalItems: totalTopLevelComments(),
                    };
              track c.id
            ) {}
          </div>

          @for (comment of paginatedComments(); track comment.id) {
            <div class="comment-item" [id]="'comment-' + comment.id">
              <!-- Main Comment Card -->
              <div
                class="bg-[var(--mat-sys-surface-container-low)] rounded-[2.5rem] p-8 border border-[var(--mat-sys-outline-variant)] shadow-sm relative group">
                <div
                  class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
                  <div class="flex flex-col">
                    @if (comment.author.toLowerCase() === 'delisha marie') {
                      <a
                        routerLink="/about"
                        class="comment-author text-xl font-black tracking-tight underline hover:text-[var(--mat-sys-primary)] transition-colors">
                        {{ comment.author }}
                      </a>
                    } @else if (comment.website) {
                      <a
                        [href]="comment.website"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="comment-author text-xl font-black tracking-tight underline hover:text-[var(--mat-sys-primary)] transition-colors">
                        {{ comment.author }}
                      </a>
                    } @else {
                      <span class="comment-author text-xl font-black tracking-tight">{{
                        comment.author
                      }}</span>
                    }
                    <span class="text-xs opacity-50 font-medium">
                      {{ comment.createdAt | date: 'MMM d, yyyy' }} @
                      {{ comment.createdAt | date: 'h:mm a' }}
                    </span>
                  </div>
                  @if (comment.rating) {
                    <dml-stars [rating]="comment.rating" />
                  }
                </div>

                <p
                  class="comment-content text-lg leading-relaxed text-[var(--mat-sys-on-surface-variant)] mb-6">
                  {{ comment.content }}
                </p>

                <div class="flex justify-end">
                  <button
                    mat-stroked-button
                    (click)="replyToComment(comment)"
                    class="rounded-full font-bold">
                    Reply
                  </button>
                </div>
              </div>

              <!-- Nested Replies -->
              @if (getReplies(comment.id); as replies) {
                @if (replies.length > 0) {
                  <div class="ml-8 md:ml-16 mt-6 space-y-6 relative">
                    <div
                      class="absolute left-[-2rem] top-0 bottom-0 w-px bg-[var(--mat-sys-outline-variant)] opacity-30"></div>
                    @for (reply of replies; track reply.id) {
                      <div
                        class="bg-[var(--mat-sys-surface-container)] rounded-[2rem] p-6 border border-[var(--mat-sys-outline-variant)] border-opacity-50"
                        [id]="'comment-' + reply.id">
                        <div class="flex items-start justify-between mb-3">
                          <div class="flex flex-col">
                            <div class="flex items-center gap-2">
                              @if (reply.author.toLowerCase() === 'delisha marie') {
                                <a
                                  routerLink="/about"
                                  class="text-lg font-black underline hover:text-[var(--mat-sys-primary)] transition-colors"
                                  >{{ reply.author }}</a
                                >
                              } @else if (reply.website) {
                                <a
                                  [href]="reply.website"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="text-lg font-black underline hover:text-[var(--mat-sys-primary)] transition-colors"
                                  >{{ reply.author }}</a
                                >
                              } @else {
                                <span class="text-lg font-black">{{ reply.author }}</span>
                              }
                              <span class="text-[10px] font-bold uppercase opacity-30"
                                >Replied</span
                              >
                            </div>
                            <span class="text-[10px] opacity-40 font-medium">
                              {{ reply.createdAt | date: 'MMM d, yyyy' }} @
                              {{ reply.createdAt | date: 'h:mm a' }}
                            </span>
                          </div>
                        </div>
                        <p class="text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
                          {{ reply.content }}
                        </p>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        }
      </div>

      <!-- Pagination Controls -->
      @if (totalTopLevelComments() > pageSize()) {
        <div class="flex justify-center pt-12 pb-4">
          <pagination-controls
            (pageChange)="onPageChange($event)"
            [responsive]="true"
            previousLabel="Oldest"
            nextLabel="Newest"
            class="recipe-pagination">
          </pagination-controls>
        </div>
      }
    </div>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeComments {
  recipe = input.required<Recipe>();
  page = input<string>();
  commentCountChange = output<number>();

  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly window = inject(WINDOW);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for state
  replyTo = signal<Comment | null>(null);
  pageSize = signal(50);

  currentPage = computed(() => {
    const p = this.page();
    if (p) return Number.parseInt(p, 10);

    const total = this.totalTopLevelComments();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  // Resource for comments
  private readonly commentsResource = resource({
    params: () => ({ recipeId: this.recipe().id, page: this.page() }),
    loader: ({ params }) =>
      this.recipeService.getComments(
        params.recipeId,
        params.page ? Number.parseInt(params.page, 10) : undefined,
      ),
  });

  comments = computed(() => this.commentsResource.value()?.comments || []);
  totalTopLevelComments = computed(() => this.commentsResource.value()?.total || 0);
  loading = computed(() => this.commentsResource.isLoading());

  topLevelComments = computed(() => {
    return this.comments()
      .filter((c) => !c.parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  paginatedComments = computed(() => {
    return this.topLevelComments().slice().reverse();
  });

  getReplies(parentId: string) {
    return this.comments()
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Signal Form
  private readonly formModel = signal<CommentFormValue>({
    author: '',
    email: '',
    website: '',
    content: '',
    rating: null,
    alt_email: '',
    isNew: false,
  });

  protected commentForm = form(
    this.formModel,
    (s) => {
      required(s.author, { message: 'Name is required' });
      required(s.email, { message: 'Email is required' });
      email(s.email, { message: 'Enter a valid email' });
      required(s.content, { message: 'Comment is required' });
    },
    {
      submission: {
        action: async (f) => {
          const value = f().value();
          const newComment: Omit<Comment, 'id' | 'createdAt'> & { alt_email?: string } = {
            recipeId: String(this.recipe().id),
            author: value.author,
            email: value.email,
            website: value.website || undefined,
            content: value.content,
            rating: value.rating || undefined,
            parentId: this.replyTo()?.id,
            alt_email: value.alt_email,
          };

          try {
            const saved = await this.recipeService.addComment(newComment);
            this.commentsResource.update((prev) => {
              if (!prev) return { comments: [saved], total: 1 };
              const isReply = !!saved.parentId;
              return {
                comments: [saved, ...prev.comments],
                total: isReply ? prev.total : prev.total + 1,
              };
            });

            f().reset({
              author: '',
              email: '',
              website: '',
              content: '',
              rating: null,
              alt_email: '',
              isNew: false,
            });

            const isReply = !!this.replyTo();
            this.replyTo.set(null);

            setTimeout(() => {
              const targetId = isReply ? `comment-${saved.id}` : 'comments';
              const el = this.window.document.getElementById(targetId);
              if (el) {
                const y = el.getBoundingClientRect().top + this.window.scrollY - 120;
                this.window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }, 100);

            this.commentCountChange.emit(this.totalTopLevelComments());
          } catch (err: unknown) {
            console.error('Failed to post comment', err);
            let errMsg = 'Failed to post comment. Please try again.';
            const e = err as { error?: { error?: string }; message?: string };
            if (e?.error?.error) {
              errMsg = e.error.error;
            } else if (e?.message) {
              errMsg = e.message;
            }
            this.snackBar.open(errMsg, 'Close', { duration: 10000 });
          }
        },
      },
    },
  );

  onPageChange(p: number) {
    const slug = this.recipe().slug;
    const cleanSlug = slug.replace(/^\/?recipe\//, '').replace(/^\//, '');

    // Default route is the last page
    const total = this.totalTopLevelComments();
    const size = this.pageSize();
    const lastPage = Math.max(1, Math.ceil(total / size));

    const path = p === lastPage ? `/recipe/${cleanSlug}` : `/recipe/${cleanSlug}/page/${p}`;

    this.router.navigate([path], { fragment: 'comments' });
  }

  setRating(rating: number) {
    this.formModel.update((m) => ({ ...m, rating }));
  }

  replyToComment(comment: Comment) {
    this.replyTo.set(comment);
    this.formModel.update((m) => ({ ...m, rating: null }));

    setTimeout(() => {
      const el = this.window.document.getElementById('respond');
      if (el) {
        const y = el.getBoundingClientRect().top + this.window.scrollY - 120;
        this.window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
  }

  cancelReply() {
    this.replyTo.set(null);
  }
}
