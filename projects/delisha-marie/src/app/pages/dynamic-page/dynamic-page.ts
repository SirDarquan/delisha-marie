import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  computed,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Page, PagesService } from '../../services/pages.service';
import { ContactForm } from '../../components/contact-form/contact-form';
import { useOptimizedContent } from '../../utils/optimized-content';
import { SeoService } from '../../services/seo.service';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';

@Component({
  selector: 'dm-dynamic-page',
  imports: [Sidebar, ContactForm, ColoredHeaderComponent],
  template: `
    <div class="into-the-box py-12">
      <div class="flex flex-col lg:flex-row gap-12">
        <!-- Main Content -->
        <div class="lg:w-2/3 space-y-16">
          @if (page()) {
            <dm-colored-header [title]="page()!.title" />
            <div
              class="story prose prose-invert prose-lg max-w-none leading-relaxed font-serif first-letter:text-6xl first-letter:font-black first-letter:mr-1 first-letter:text-[var(--mat-sys-primary)]"
              [innerHTML]="optimizedContent()"></div>

            @if (page()?.slug === 'contact') {
              <dm-contact-form />
            }
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
        <aside class="lg:w-1/3">
          <dml-sidebar />
        </aside>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPage {
  private readonly route = inject(ActivatedRoute);
  private readonly pagesService = inject(PagesService);
  private readonly seoService = inject(SeoService);
  private readonly _params = toSignal(this.route.params);

  private readonly _pageResource = resource({
    params: () => this._params()?.['slug'] as string | undefined,
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
