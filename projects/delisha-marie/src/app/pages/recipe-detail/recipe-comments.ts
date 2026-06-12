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
import { Router } from '@angular/router';
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
  ],
  template: `
    <div class="recipe-comments mt-20" id="comments">
      <!-- Comments Header -->
      <div class="flex items-center gap-4 mb-10">
        <h2 class="text-3xl font-black tracking-tight">
          {{ topLevelComments().length }} comment(s) on '{{ recipe().title }}'
        </h2>
        <div class="h-px flex-1 bg-[var(--mat-sys-outline-variant)] opacity-30"></div>
      </div>

      <!-- Comment Form -->
      <div
        class="bg-[var(--mat-sys-surface-container-low)] rounded-[2.5rem] p-6 sm:p-8 md:p-12 border-y sm:border border-[var(--mat-sys-outline-variant)] mb-16"
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
              @if (commentForm.author().errors().length > 0 && commentForm.author().touched()) {
                <span class="text-xs text-red-500 ml-2">{{
                  commentForm.author().errors()[0].message
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
              @if (commentForm.email().errors().length > 0 && commentForm.email().touched()) {
                <span class="text-xs text-red-500 ml-2">{{
                  commentForm.email().errors()[0].message
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
            @if (commentForm.content().errors().length > 0 && commentForm.content().touched()) {
              <span class="text-xs text-red-500 ml-2">{{
                commentForm.content().errors()[0].message
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
        } @else {
          <!-- Register with ngx-pagination internally -->
          <div style="display: none">
            @for (
              c of topLevelComments()
                | paginate: { itemsPerPage: pageSize(), currentPage: currentPage() };
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
                    <span class="comment-author text-xl font-black tracking-tight">{{
                      comment.author
                    }}</span>
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
                              <span class="text-lg font-black">{{ reply.author }}</span>
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
      @if (topLevelComments().length > pageSize()) {
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
  styles: [
    `
      :host {
        display: block;
      }
      /* ngx-pagination customization to match recipe-list */
      .recipe-pagination .ngx-pagination {
        margin-bottom: 0;
        padding-left: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
        font-family: inherit;
      }

      .recipe-pagination .ngx-pagination .small-screen {
        display: none;
        padding: 0.75rem 1rem;
      }

      .recipe-pagination .ngx-pagination li {
        display: inline-block;
        border-radius: 0.75rem;
        transition: all 0.3s ease;
        font-weight: 700;
        font-size: 0.875rem;
        margin: 0;
      }

      .recipe-pagination .ngx-pagination a,
      .recipe-pagination .ngx-pagination button {
        padding: 0.75rem 1rem !important;
        border-radius: 0.75rem !important;
        color: var(--mat-sys-on-surface) !important;
        text-decoration: none !important;
        display: block !important;
        outline: none !important;
        background: transparent !important;
      }

      .recipe-pagination .ngx-pagination a:hover,
      .recipe-pagination .ngx-pagination button:hover {
        background: var(--mat-sys-surface-container-highest) !important;
        color: var(--mat-sys-primary) !important;
      }

      .recipe-pagination .ngx-pagination .current {
        background: var(--mat-sys-primary) !important;
        color: var(--mat-sys-on-primary) !important;
        padding: 0.75rem 1rem !important;
        border-radius: 0.75rem !important;
      }

      .recipe-pagination .ngx-pagination .disabled {
        opacity: 0.3;
        padding: 0.75rem 1rem;
      }
    `,
  ],
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

  // Signals for state
  replyTo = signal<Comment | null>(null);
  pageSize = signal(50);

  currentPage = computed(() => {
    const p = this.page();
    if (p) return Number.parseInt(p, 10);

    const total = this.topLevelComments().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  // Resource for comments
  private readonly commentsResource = resource({
    params: () => ({ recipeId: this.recipe().id }),
    loader: ({ params }) => this.recipeService.getComments(params.recipeId),
  });

  comments = computed(() => this.commentsResource.value() || []);
  loading = computed(() => this.commentsResource.isLoading());

  topLevelComments = computed(() => {
    return this.comments()
      .filter((c) => !c.parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  paginatedComments = computed(() => {
    const p = this.currentPage();
    const size = this.pageSize();
    const all = this.topLevelComments(); // Sorted oldest first
    const total = all.length;

    if (total === 0) return [];

    const lastPage = Math.max(1, Math.ceil(total / size));

    // We want the last page to have the full 'size' if possible,
    // and the first page to have the remainder.
    // Example: total 102, size 50. Page 3 should be 53-102 (indices 52-101).
    const end = total - (lastPage - p) * size;
    const start = Math.max(0, end - size);

    const slice = all.slice(start, end);
    // Reverse within the page so newest in this block is at the top
    return [...slice].reverse();
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
          const newComment: Omit<Comment, 'id' | 'createdAt'> = {
            recipeId: String(this.recipe().id),
            author: value.author,
            email: value.email,
            website: value.website || undefined,
            content: value.content,
            rating: value.rating || undefined,
            parentId: this.replyTo()?.id,
          };

          try {
            const saved = await this.recipeService.addComment(newComment);
            this.commentsResource.update((prev) => (prev ? [saved, ...prev] : [saved]));

            f().reset({
              author: '',
              email: '',
              website: '',
              content: '',
              rating: null,
            });

            const isReply = !!this.replyTo();
            this.replyTo.set(null);

            setTimeout(() => {
              const targetId = isReply ? `comment-${saved.id}` : 'comments';
              const el = this.window.document.getElementById(targetId);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

            this.commentCountChange.emit(this.topLevelComments().length);
          } catch (err) {
            console.error('Failed to post comment', err);
          }
        },
      },
    },
  );

  onPageChange(p: number) {
    const slug = this.recipe().slug;
    const cleanSlug = slug.replace(/^\/?recipe\//, '').replace(/^\//, '');

    // Default route is the last page
    const total = this.topLevelComments().length;
    const size = this.pageSize();
    const lastPage = Math.max(1, Math.ceil(total / size));

    const path = p === lastPage ? `/recipe/${cleanSlug}` : `/recipe/${cleanSlug}/page/${p}`;

    this.router.navigate([path], { fragment: 'comments' });

    setTimeout(() => {
      const el = this.window.document.getElementById('comments');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  setRating(rating: number) {
    this.formModel.update((m) => ({ ...m, rating }));
  }

  replyToComment(comment: Comment) {
    this.replyTo.set(comment);
    this.formModel.update((m) => ({ ...m, rating: null }));

    setTimeout(() => {
      const el = this.window.document.getElementById('respond');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  cancelReply() {
    this.replyTo.set(null);
  }
}
