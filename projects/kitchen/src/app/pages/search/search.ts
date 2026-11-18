import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
  computed,
  effect,
  resource,
  untracked,
  DOCUMENT,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router, ActivatedRoute } from '@angular/router';

import { RecipeGrid } from '@dm/library';
import { Sidebar } from '../../components/sidebar/sidebar';

import { SearchService, SearchResultRecipe } from './search.service';

interface SearchFormValue {
  q: string;
}

@Component({
  selector: 'dm-search',
  imports: [MatIconModule, FormField, FormRoot, Sidebar, RecipeGrid],
  template: `
    <main class="min-h-screen pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Search Header -->
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h1 class="text-4xl font-black text-[var(--mat-sys-on-surface)] mb-6 font-serif">
            Recipe Search
          </h1>

          <form [formRoot]="searchForm" class="relative max-w-2xl mx-auto">
            <mat-icon
              class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mat-sys-on-surface-variant)] z-10"
              >search</mat-icon
            >
            <input
              type="text"
              [formField]="searchForm.q"
              placeholder="What are you craving? (e.g. 'something spicy with chicken')"
              class="w-full h-14 pl-12 pr-32 rounded-full border-2 border-[var(--mat-sys-outline)] focus:border-[var(--mat-sys-primary)] focus:outline-none text-lg shadow-sm transition-colors bg-[var(--mat-sys-surface)] text-[var(--mat-sys-on-surface)]" />
            <button
              type="submit"
              [disabled]="loading()"
              class="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--mat-sys-primary)] hover:brightness-110 disabled:opacity-50 text-[var(--mat-sys-on-primary)] px-6 py-2 rounded-full font-bold transition-all">
              {{ loading() ? 'Searching...' : 'Search' }}
            </button>
          </form>
        </div>

        <!-- Content and Sidebar Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 lg:gap-12">
          <!-- Main Content -->
          <div class="w-full min-w-0">
            @if (!hasSearched()) {
              <div class="text-center text-[var(--mat-sys-on-surface-variant)] py-12">
                Enter a search term above to find matching recipes.
              </div>
            } @else {
              <dml-recipe-grid
                [recipes]="displayedRecipes()"
                [columns]="2"
                [variant]="'card-link'"
                [pageSize]="pageSize"
                [currentPage]="currentPage()"
                [totalItems]="totalItems()"
                [isLoading]="loading()"
                [emptyMessage]="'No matching recipes found. Try a different search term!'"
                (pageChange)="onPageChange($event)" />
            }
          </div>

          <!-- Sidebar -->
          <aside class="w-full shrink-0">
            <dml-sidebar />
          </aside>
        </div>
      </div>
    </main>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  readonly searchModel = signal<SearchFormValue>({ q: '' });
  readonly searchForm = form(
    this.searchModel,
    (s) => {
      required(s.q, { message: 'Please enter a search term' });
    },
    {
      submission: {
        action: async (forms) => {
          const vals = forms().value();
          if (vals.q?.trim()) {
            await this.router.navigate(['/'], {
              queryParams: { q: vals.q },
              queryParamsHandling: 'merge',
            });
          }
        },
      },
    },
  );
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private readonly document = inject(DOCUMENT);

  private readonly _params = toSignal(this.route.params);
  private readonly _queryParams = toSignal(this.route.queryParams);

  readonly currentPage = computed(() => {
    const p = this._params()?.['page'];
    return p ? Number.parseInt(p, 10) : 1;
  });

  readonly query = computed(() => this._queryParams()?.['q']?.trim() || '');
  readonly pageSize = 12;

  readonly searchResource = resource({
    params: () => ({ q: this.query(), page: this.currentPage(), pageSize: this.pageSize }),
    loader: async ({ params }) => {
      return this.searchService.searchRecipes(params.q, params.page, params.pageSize);
    },
  });

  private readonly _previousRecipes = signal<SearchResultRecipe[]>([]);
  readonly recipes = computed(() => this.searchResource.value()?.items || []);
  readonly totalItems = computed(() => this.searchResource.value()?.total || 0);
  readonly loading = computed(() => this.searchResource.isLoading());
  readonly hasSearched = computed(() => !!this.query());

  readonly displayedRecipes = computed(() => {
    const current = this.recipes();
    if (current.length > 0) {
      return current;
    }
    if (this.loading() && this._previousRecipes().length > 0) {
      return this._previousRecipes();
    }
    return current;
  });

  private readonly _updatePreviousEffect = effect(() => {
    const items = this.recipes();
    if (items.length > 0) {
      untracked(() => {
        this._previousRecipes.set(items);
      });
    }
  });

  private readonly _prefetchNextPageEffect = effect(() => {
    const page = this.currentPage();
    const query = this.query();
    const total = this.totalItems();
    const pageSize = this.pageSize;

    if (query && total > page * pageSize) {
      this.searchService.prefetchSearch(query, page + 1, pageSize);
    }
  });

  private readonly _syncEffect = effect(() => {
    const q = this.query();
    untracked(() => {
      if (this.searchModel().q !== q) {
        this.searchModel.update((m) => ({ ...m, q }));
      }
    });
  });

  onPageChange(p: number): void {
    const window = this.document.defaultView;
    const query = this.searchModel().q;
    const path = p === 1 ? '/' : `/page/${p}`;

    void this.router.navigate([path], {
      queryParams: { q: query?.trim() },
      queryParamsHandling: 'merge',
    });
    window?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
