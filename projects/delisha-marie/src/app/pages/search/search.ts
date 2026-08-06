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
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../../services/api';
import { Sidebar } from '../../components/sidebar/sidebar';
import { NgxPaginationModule } from 'ngx-pagination';
import { WINDOW } from '../../services/global-tokens';

interface SearchFormValue {
  q: string;
}

interface SearchResultRecipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  similarity: number;
}

@Component({
  selector: 'dm-search',
  imports: [
    CommonModule,
    MatIconModule,
    NgOptimizedImage,
    FormField,
    FormRoot,
    RouterLink,
    Sidebar,
    NgxPaginationModule,
  ],
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
        <div class="flex flex-col lg:flex-row gap-12">
          <!-- Main Content -->
          <div class="lg:w-2/3 w-full">
            <!-- 2 Column Results -->
            @if (loading()) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                @for (placeholder of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track placeholder) {
                  <div
                    class="bg-[var(--mat-sys-surface)] rounded-2xl shadow-sm border border-[var(--mat-sys-outline-variant)] overflow-hidden h-full flex flex-col animate-pulse">
                    <div
                      class="aspect-video w-full bg-[var(--mat-sys-surface-container-highest)] relative">
                      <!-- Match Score Badge Skeleton -->
                      <div
                        class="absolute top-4 right-4 bg-[var(--mat-sys-surface)]/50 backdrop-blur-sm w-16 h-6 rounded-md"></div>
                    </div>
                    <div class="p-6 flex-1 flex flex-col space-y-3">
                      <div
                        class="h-6 bg-[var(--mat-sys-surface-container-highest)] rounded w-3/4"></div>
                      <div class="space-y-2 pt-2">
                        <div
                          class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-full"></div>
                        <div
                          class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                @if (recipes().length === 0 && hasSearched()) {
                  <div
                    class="col-span-1 md:col-span-2 text-center text-[var(--mat-sys-on-surface-variant)] py-12">
                    No matching recipes found. Try a different search term!
                  </div>
                } @else if (!hasSearched()) {
                  <div
                    class="col-span-1 md:col-span-2 text-center text-[var(--mat-sys-on-surface-variant)] py-12">
                    Enter a search term above to find matching recipes.
                  </div>
                }

                @for (
                  recipe of recipes()
                    | paginate
                      : {
                          itemsPerPage: pageSize,
                          currentPage: currentPage(),
                          totalItems: totalItems(),
                        };
                  track recipe.id
                ) {
                  <a
                    [routerLink]="['/recipe', recipe.slug]"
                    class="block group cursor-pointer h-full">
                    <div
                      class="bg-[var(--mat-sys-surface)] rounded-2xl shadow-sm border border-[var(--mat-sys-outline-variant)] overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                      <div
                        class="aspect-video w-full overflow-hidden bg-[var(--mat-sys-surface-container)] relative">
                        <img
                          [ngSrc]="recipe.image"
                          priority
                          fill
                          [alt]="recipe.title"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <!-- Match Score Badge -->
                        <div
                          class="absolute top-4 right-4 bg-[var(--mat-sys-surface)]/90 backdrop-blur-sm text-[var(--mat-sys-on-surface)] text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                          {{ recipe.similarity * 100 | number: '1.0-0' }}% Match
                        </div>
                      </div>
                      <div class="p-6 flex-1 flex flex-col">
                        <h3
                          class="text-xl font-bold text-[var(--mat-sys-on-surface)] mb-2 group-hover:text-[var(--mat-sys-primary)] transition-colors">
                          {{ recipe.title }}
                        </h3>
                        <p
                          class="text-[var(--mat-sys-on-surface-variant)] line-clamp-2 text-sm flex-1">
                          {{ recipe.description }}
                        </p>
                      </div>
                    </div>
                  </a>
                }
              </div>

              <!-- Paginator -->
              @if (!loading() && totalItems() > pageSize) {
                <div class="flex justify-center pt-8 pb-4">
                  <pagination-controls
                    (pageChange)="onPageChange($event)"
                    [responsive]="true"
                    class="recipe-pagination">
                  </pagination-controls>
                </div>
              }
            }
          </div>

          <!-- Sidebar -->
          <aside class="lg:w-1/3 w-full">
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
            await this.router.navigate(['/search'], {
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
  private readonly api = inject(Api);
  private readonly window = inject(WINDOW);

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
      if (!params.q) {
        return { items: [], total: 0 } as { items: SearchResultRecipe[]; total: number };
      }
      return this.api.post<{ items: SearchResultRecipe[]; total: number }>('/api/recipes/search', {
        query: params.q,
        page: params.page,
        pageSize: params.pageSize,
      });
    },
  });

  readonly recipes = computed(() => this.searchResource.value()?.items || []);
  readonly totalItems = computed(() => this.searchResource.value()?.total || 0);
  readonly loading = computed(() => this.searchResource.isLoading());
  readonly hasSearched = computed(() => !!this.query());

  private readonly _syncEffect = effect(() => {
    const q = this.query();
    untracked(() => {
      if (this.searchModel().q !== q) {
        this.searchModel.update((m) => ({ ...m, q }));
      }
    });
  });

  onPageChange(p: number): void {
    const query = this.searchModel().q;
    const path = p === 1 ? '/search' : `/search/page/${p}`;

    this.router.navigate([path], {
      queryParams: { q: query?.trim() },
      queryParamsHandling: 'merge',
    });
    this.window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
