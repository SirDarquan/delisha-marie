import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { Page, PagesService } from '../../services/pages.service';
import { AuthService } from '../../services/auth.service';
import { AddPostDialogComponent } from '../../components/add-post-dialog/add-post-dialog';
import {
  CreatePageDialogComponent,
  CreatePageDialogResult,
} from '../create-page-dialog/create-page-dialog';

export interface BlockInfo {
  hasBlock: boolean;
  height?: number;
  label?: string;
}

@Component({
  selector: 'app-pages-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="px-4 md:px-8 py-8 space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Blog Pages & Posts
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            Manage pages by blog post. Kitchen is normal and legacy; Home and other posts use post
            prefixes.
          </p>
        </div>
        <button
          mat-flat-button
          type="button"
          (click)="openAddPageDialog()"
          class="!px-5 !py-2.5 !rounded-xl !font-bold !text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition shadow-lg cursor-pointer self-start sm:self-auto flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-[18px]">add</mat-icon>
          Add Page
        </button>
      </div>

      <!-- Blog Post Selector Control -->
      <div
        class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
            <mat-icon class="!w-4 !h-4 !text-[18px] text-purple-400">feed</mat-icon>
            Blog Posts:
          </span>

          @for (post of posts(); track post) {
            <button
              type="button"
              (click)="selectPost(post)"
              class="px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer capitalize"
              [class.bg-purple-500/20]="activePost() === post"
              [class.text-purple-300]="activePost() === post"
              [class.border]="true"
              [class.border-purple-500/40]="activePost() === post"
              [class.shadow-inner]="activePost() === post"
              [class.font-bold]="activePost() === post"
              [class.bg-slate-800/80]="activePost() !== post"
              [class.text-slate-300]="activePost() !== post"
              [class.border-slate-700/60]="activePost() !== post"
              [class.hover:bg-slate-700/70]="activePost() !== post">
              <span>{{ post }}</span>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded-full"
                [class.bg-purple-500/30]="activePost() === post"
                [class.bg-slate-750]="activePost() !== post">
                {{ getPostCount(post) }}
              </span>
            </button>
          }

          <!-- + Add New Blog Post -->
          <button
            type="button"
            (click)="openAddPostDialog()"
            class="px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-dashed border-slate-600 hover:border-purple-400 hover:text-purple-300 cursor-pointer"
            title="Add another blog post section">
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">add</mat-icon>
            <span>New Post</span>
          </button>
        </div>

        <div class="text-xs text-slate-400">
          Viewing: <span class="font-bold text-white capitalize">{{ activePost() }}</span>
          <span class="text-slate-500 ml-1">
            @if (activePost() === 'kitchen') {
              (finds kitchen:slug and legacy unprefixed slugs)
            } @else {
              (finds {{ activePost() }}: slugs)
            }
          </span>
        </div>
      </div>

      <!-- Loading Spinner -->
      @if (loading()) {
        <div class="flex justify-center p-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <!-- Page Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (page of filteredPages(); track page.slug) {
            @let block = getBlockInfo(page);
            <div
              class="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                    /{{ page.slug }}
                  </span>
                  @if (block.hasBlock) {
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <mat-icon class="!w-3 !h-3 !text-[12px]">widgets</mat-icon>
                      Block: {{ block.height || 380 }}px
                    </span>
                  }
                </div>

                <h2 class="text-lg font-bold text-white group-hover:text-purple-300 transition">
                  {{ page.title }}
                </h2>

                <p class="text-slate-400 text-xs line-clamp-2">
                  {{
                    page.description ||
                      'Manage content, write stories beside or under components, and set custom layout block sizes.'
                  }}
                </p>
              </div>

              <div
                class="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Updated {{ (page.updated_at | date: 'mediumDate') || 'Never' }}</span>
                <a
                  mat-button
                  [routerLink]="['/pages', page.slug]"
                  class="!px-3 !py-1.5 !rounded-lg !bg-slate-800 hover:!bg-purple-600 hover:!text-white !text-slate-300 transition flex items-center gap-1 !font-semibold !text-xs cursor-pointer">
                  <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">edit</mat-icon>
                  Edit Page
                </a>
              </div>
            </div>
          } @empty {
            <div
              class="col-span-full py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <mat-icon class="!w-12 !h-12 !text-[48px] text-slate-600 mb-2">article</mat-icon>
              <p class="font-bold text-slate-300 text-lg">No pages in {{ activePost() }}</p>
              <p class="text-sm text-slate-500 mt-1">
                Click "+ Add Page" to create your first page for {{ activePost() }}:slug.
              </p>
              <button
                mat-flat-button
                type="button"
                (click)="openAddPageDialog()"
                class="mt-4 !px-4 !py-2 !text-xs !font-bold !rounded-xl !bg-purple-600 !text-white hover:!bg-purple-500 transition cursor-pointer">
                + Add Page
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagesListComponent {
  private readonly pagesService = inject(PagesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly tenant = computed(() =>
    typeof this.authService.tenant === 'function' ? this.authService.tenant() : null,
  );

  private readonly _pagesResource = resource({
    loader: () => this.pagesService.getPages(),
  });

  protected readonly loading = computed(() => this._pagesResource.isLoading());

  protected readonly pages = computed(() => {
    if (this._pagesResource.error()) return [];
    const db = this._pagesResource.value() || [];
    return db.filter((page, index, self) => index === self.findIndex((p) => p.slug === page.slug));
  });

  protected readonly activePost = signal<string>('home');
  protected readonly customPosts = signal<string[]>([]);

  protected readonly posts = computed(() => {
    const list = ['home', 'kitchen'];
    // Derive any posts present in page slugs
    for (const page of this.pages()) {
      if (page.slug.includes(':')) {
        const prefix = page.slug.split(':')[0].toLowerCase();
        if (prefix && !list.includes(prefix)) {
          list.push(prefix);
        }
      }
    }
    // Include user-created custom posts
    for (const post of this.customPosts()) {
      if (!list.includes(post)) {
        list.push(post);
      }
    }
    return list;
  });

  protected readonly filteredPages = computed(() => {
    const current = this.activePost();
    const all = this.pages();
    if (current === 'kitchen') {
      return all.filter((p) => p.slug.startsWith('kitchen:') || !p.slug.includes(':'));
    }
    return all.filter((p) => p.slug.startsWith(`${current}:`));
  });

  selectPost(post: string): void {
    this.activePost.set(post);
  }

  getPostCount(post: string): number {
    const all = this.pages();
    if (post === 'kitchen') {
      return all.filter((p) => p.slug.startsWith('kitchen:') || !p.slug.includes(':')).length;
    }
    return all.filter((p) => p.slug.startsWith(`${post}:`)).length;
  }

  getBlockInfo(page: Page): BlockInfo {
    const content = page.content || '';
    const hasBlock =
      content.includes('data-component-block="true"') ||
      content.includes('class="story-component-block"') ||
      content.includes("class='story-component-block'");

    if (!hasBlock) {
      return { hasBlock: false };
    }

    const heightMatch = content.match(/data-block-height=["']?(\d+)["']?/);
    const labelMatch = content.match(/data-block-label=["']([^"']+)["']/);

    return {
      hasBlock: true,
      height: heightMatch ? parseInt(heightMatch[1], 10) : 380,
      label: labelMatch ? labelMatch[1] : undefined,
    };
  }

  openAddPostDialog(): void {
    const dialogRef = this.dialog.open<AddPostDialogComponent, unknown, string>(
      AddPostDialogComponent,
      {
        width: '460px',
      },
    );

    dialogRef.afterClosed().subscribe((newPostName) => {
      if (newPostName) {
        if (!this.customPosts().includes(newPostName)) {
          this.customPosts.update((prev) => [...prev, newPostName]);
        }
        this.selectPost(newPostName);
      }
    });
  }

  openAddPageDialog(): void {
    const dialogRef = this.dialog.open<
      CreatePageDialogComponent,
      { activePost: string },
      CreatePageDialogResult
    >(CreatePageDialogComponent, {
      width: '500px',
      data: { activePost: this.activePost() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        void this.router.navigate(['/pages', result.fullSlug]);
      }
    });
  }
}
