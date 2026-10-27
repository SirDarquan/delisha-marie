import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';
import { Page, PagesService } from '../../services/pages.service';
import { getKitchenUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-dynamic-page',
  imports: [ColoredHeaderComponent],
  template: `
    <article
      class="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12 text-[var(--mat-sys-on-surface)]">
      @if (page(); as currentPage) {
        <div>
          <dm-colored-header [title]="currentPage.title" />
          @if (currentPage.description) {
            <p
              class="text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] max-w-3xl leading-relaxed -mt-10">
              {{ currentPage.description }}
            </p>
          }
        </div>
        <div
          class="story flex flex-col gap-12 text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] leading-relaxed font-serif first-letter:text-6xl first-letter:font-black first-letter:mr-1 first-letter:text-[var(--mat-sys-primary)] [&>*:first-child]:first-letter:text-6xl [&>*:first-child]:first-letter:font-black [&>*:first-child]:first-letter:mr-1 [&>*:first-child]:first-letter:text-[var(--mat-sys-primary)] [&_section.flex-col_p]:!mb-0 [&_.grid_p]:!mb-0 [&_section_h2:first-child]:!mt-0 [&_section_h2:first-child]:!mb-0 [&_section.flex-col>h2:first-child]:!text-[var(--mat-sys-primary)] [&_.grid_h3]:!mt-0 [&_.grid_h3]:!mb-0 [&_a.no-underline]:!no-underline"
          [innerHTML]="safeContent()"></div>
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
    </article>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPage {
  private readonly route = inject(ActivatedRoute);
  private readonly pagesService = inject(PagesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly _params = toSignal(this.route.params);
  private readonly _data = toSignal(this.route.data);

  // Tailwind safelist for dynamic database page HTML:
  // grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 gap-3 gap-6 gap-12 p-6 p-8 md:p-12 rounded-xl rounded-2xl rounded-3xl rounded-full bg-[var(--mat-sys-surface-container)] bg-[var(--mat-sys-surface-container-high)] bg-gradient-to-r from-[var(--mat-sys-surface-container)] to-[var(--mat-sys-surface-container-high)] border border-[var(--mat-sys-outline-variant)] border-[var(--mat-sys-outline-variant)]/40 text-[var(--mat-sys-primary)] text-[var(--mat-sys-tertiary)] text-[var(--mat-sys-on-surface)] text-[var(--mat-sys-on-surface-variant)] !bg-[var(--mat-sys-primary)] !text-black !font-semibold !px-8 !py-4 !py-6 !text-base !text-3xl shadow-xl shadow-2xl backdrop-blur-md sm:flex-row sm:text-left no-underline space-y-4 space-y-6
  readonly kitchenUrl = getKitchenUrl();

  private readonly _pageResource = resource({
    params: () => (this._params()?.['slug'] ?? this._data()?.['slug']) as string | undefined,
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

  protected readonly safeContent = computed<SafeHtml | null>(() => {
    const rawContent = this.page()?.content;
    if (!rawContent) return null;

    const normalized = rawContent
      .replaceAll('{{kitchenUrl}}', this.kitchenUrl)
      .replaceAll('&#123;&#123;kitchenUrl&#125;&#125;', this.kitchenUrl)
      .replaceAll('%7B%7BkitchenUrl%7D%7D', this.kitchenUrl)
      .replace(
        /(<a\b[^>]*\bhref=["'])([^"']*)(["'][^>]*>[\s\S]*?Visit the Kitchen[\s\S]*?<\/a>)/gi,
        `$1${this.kitchenUrl}$3`,
      )
      .replace(/<mat-icon([^>]*)>([^<]*)<\/mat-icon>/gi, (_, attrs: string, iconName: string) => {
        const classMatch = /class=["']([^"']*)["']/i.exec(attrs);
        const extraClasses = classMatch ? ` ${classMatch[1]}` : '';
        return `<span class="material-icons${extraClasses}">${iconName}</span>`;
      });

    return this.sanitizer.bypassSecurityTrustHtml(normalized);
  });
}
