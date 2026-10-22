import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  computed,
  resource,
  input,
} from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Page, PagesService } from '../../services/pages.service';
import { useOptimizedContent } from '../../utils/optimized-content';
import { ColoredHeaderComponent } from '../colored-header/colored-header';

@Component({
  selector: 'dm-page-layout',
  imports: [Sidebar, ColoredHeaderComponent],
  template: `
    <div class="into-the-box py-12">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 lg:gap-12">
        <!-- Main Content -->
        <div class="min-w-0 space-y-16">
          @if (page()) {
            <dm-colored-header [title]="page()!.title" />
            <div
              class="story prose prose-invert prose-lg max-w-none leading-relaxed font-serif first-letter:text-6xl first-letter:font-black first-letter:mr-1 first-letter:text-[var(--mat-sys-primary)]"
              [innerHTML]="optimizedContent()"></div>

            <ng-content />
          } @else if (loading()) {
            <div class="animate-pulse space-y-8">
              <div class="h-16 bg-[var(--mat-sys-surface-container-highest)] rounded w-3/4"></div>
              <div class="space-y-4">
                <div class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded"></div>
                <div class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-5/6"></div>
                <div class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-4/6"></div>
              </div>
            </div>
          } @else {
            <dm-colored-header title="Page Not Found" />
            <div class="py-24 space-y-6">
              <p class="text-lg text-[var(--mat-sys-outline)]">
                The page you are looking for does not exist or has not been published yet.
              </p>
            </div>
          }
        </div>

        <!-- Sidebar -->
        <aside class="w-full shrink-0">
          <dml-sidebar />
        </aside>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayout {
  readonly slug = input.required<string>();
  private readonly pagesService = inject(PagesService);

  private readonly _pageResource = resource({
    params: () => this.slug(),
    loader: async ({ params: slug }) => {
      if (!slug) return null;
      try {
        return await this.pagesService.getPage(slug);
      } catch (err) {
        console.error('Failed to load page', err);
        return null;
      }
    },
  });

  protected readonly loading = computed(() => this._pageResource.isLoading());
  protected readonly page = computed(() => {
    const val = this._pageResource.value();
    return val ? (val as Page) : null;
  });

  protected readonly optimizedContent = useOptimizedContent(computed(() => this.page()?.content));
}
