import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { BreadcrumbItem, Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';
import { RefineBy, RefineByItem } from '../../components/refine-by/refine-by';
import { WINDOW } from '../../services/global-tokens';
import { RecipeService } from '../../services/recipe.service';
import { deslugify } from '../../utils/slug';
import { RecipeIndexService } from '../recipe-index/recipe-index.service';

@Component({
  selector: 'dm-recipe-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    NgOptimizedImage,
    Breadcrumbs,
    RefineBy,
    NgxPaginationModule,
    RouterLink,
  ],
  template: `
    <div class="into-the-box pt-12 pb-4">
      <!-- Dynamic Breadcrumbs -->
      <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8" />

      <!-- Page Header -->
      <header class="mb-12">
        <h1
          class="text-5xl md:text-6xl font-black tracking-tighter text-[var(--mat-sys-on-surface)]">
          {{ displayTitle() }}
        </h1>
        <div class="h-1.5 w-20 bg-[var(--mat-sys-primary)] mt-4 rounded-full"></div>
      </header>

      <!-- SubCategory listing -->
      <dml-refine-by [items]="subCategories()" class="block mb-12" />

      <!-- Recipe Grid -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        @if (isLoading()) {
          @for (placeholder of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track placeholder) {
            <mat-card
              class="!bg-[var(--mat-sys-surface-container)] !rounded-[2.5rem] overflow-hidden border border-[var(--mat-sys-outline-variant)] animate-pulse">
              <div class="aspect-[4/3] bg-[var(--mat-sys-surface-container-highest)]"></div>
              <mat-card-content class="!p-6 space-y-3">
                <div class="h-6 bg-[var(--mat-sys-surface-container-highest)] rounded w-3/4"></div>
                <div class="space-y-2 pt-2">
                  <div
                    class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-full"></div>
                  <div
                    class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-5/6"></div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        } @else {
          @for (
            recipe of recipes()
              | paginate
                : { itemsPerPage: pageSize, currentPage: currentPage(), totalItems: totalItems() };
            track recipe.id
          ) {
            <a [routerLink]="['/recipe', recipe.slug]" class="block no-underline text-inherit">
              <mat-card
                class="!bg-[var(--mat-sys-surface-container)] !rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-[var(--mat-sys-outline-variant)]">
                <div class="aspect-[4/3] overflow-hidden relative">
                  <img
                    [ngSrc]="recipe.image"
                    width="400"
                    height="300"
                    [alt]="recipe.title"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <mat-card-content class="!p-6 space-y-3">
                  <h3
                    class="text-xl font-bold leading-tight line-clamp-2 group-hover:text-[var(--mat-sys-primary)] transition-colors">
                    {{ recipe.title }}
                  </h3>
                  <p
                    class="text-sm text-[var(--mat-sys-on-surface-variant)] line-clamp-3 font-medium">
                    {{ recipe.description }}
                  </p>
                </mat-card-content>
              </mat-card>
            </a>
          } @empty {
            <div class="col-span-full py-20 text-center space-y-4">
              <mat-icon class="text-6xl h-auto w-auto opacity-20">restaurant_menu</mat-icon>
              <p class="text-xl text-[var(--mat-sys-outline)]">
                No recipes found for this selection.
              </p>
            </div>
          }
        }
      </section>

      <!-- Paginator -->
      @if (!isLoading() && totalItems() > pageSize) {
        <div class="flex justify-center pt-8 pb-4">
          <pagination-controls
            (pageChange)="onPageChange($event)"
            [responsive]="true"
            class="recipe-pagination">
          </pagination-controls>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* ngx-pagination customization */
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
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        color: var(--mat-sys-on-surface);
        text-decoration: none;
        display: block;
        outline: none;
      }

      .recipe-pagination .ngx-pagination a:hover,
      .recipe-pagination .ngx-pagination button:hover {
        background: var(--mat-sys-surface-container-highest);
        color: var(--mat-sys-primary);
      }

      .recipe-pagination .ngx-pagination .current {
        background: var(--mat-sys-primary) !important;
        color: var(--mat-sys-on-primary) !important;
        padding: 0.75rem 1rem;
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
export class RecipeList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly indexService = inject(RecipeIndexService);
  private readonly window = inject(WINDOW);

  private readonly _params = toSignal(this.route.params);

  readonly pageSize = 12;

  readonly currentPage = computed(() => {
    const p = this._params()?.['page'];
    return p ? Number.parseInt(p, 10) : 1;
  });

  readonly categorySlug = computed(() => this._params()?.['category']);
  readonly subCategorySlug = computed(() => this._params()?.['subcategory']);

  // Reactive data fetching trigger
  private readonly _dataTrigger = computed(() => {
    const url = this.router.url;
    const segments = url.split('/').find((s) => !!s);
    return {
      page: this.currentPage(),
      cat: this.categorySlug(),
      sub: this.subCategorySlug(),
      method: segments || 'recipes',
    };
  });

  // MODERN: No 'from', no 'switchMap', no 'toObservable'.
  // Using resource() to handle Promise-based fetching reactively.
  // Using 'params' for the reactive source as per Angular v21 types.
  private readonly _recipeResource = resource({
    params: () => this._dataTrigger(),
    loader: ({ params: t }) =>
      this.recipeService.getRecipes(t.page, this.pageSize, t.method, t.cat, t.sub),
  });

  readonly recipes = computed(() => this._recipeResource.value()?.items || []);
  readonly totalItems = computed(() => this._recipeResource.value()?.total || 0);
  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));
  readonly isLoading = computed(() => this._recipeResource.isLoading());

  // Determine the root type based on the official path segments
  readonly rootType = computed(() => {
    // Inject dependencies
    this._params();

    const url = this.router.url;
    const segments = url.split('/').find((s) => !!s);
    const root = segments;

    if (root === 'the-best-recipes') return 'The Best Recipes';
    if (root === 'special-diets') return 'Special Diets';
    if (root === 'holiday' || root === 'holidays') return 'Holidays';
    if (root === 'methods') return 'Methods';
    if (root === 'tag') return 'Tags';
    if (root === 'recipes') return 'Recipes';

    return 'Recipes';
  });

  private readonly _dataResource = resource({
    loader: () => this.indexService.getData(),
  });
  private readonly _data = computed(() => this._dataResource.value());

  readonly basePath = computed(() => {
    const url = this.router.url.split('?')[0];
    return url.replace(/\/page\/\d+$/, '');
  });

  readonly subCategories = computed(() => {
    const data = this._data();
    if (!data) return [];

    const catSlug = this.categorySlug();
    const subSlug = this.subCategorySlug();

    if (subSlug) return [];

    let list: { name: string; url: string; children?: RefineByItem[] }[] = [];
    const type = this.rootType();
    if (type === 'Recipes') list = data.categoriesList;
    else if (type === 'Methods') list = data.methodsList;
    else if (type === 'Holidays') list = data.holidays;
    else if (type === 'Special Diets') list = data.specialDiets;
    else if (type === 'The Best Recipes') list = data.bestRecipes;
    else if (type === 'Tags') list = data.ingredients;

    if (!catSlug) return list || [];

    const currentCat = list?.find(
      (c: { name: string; url: string; children?: RefineByItem[] }) =>
        c.url.endsWith('/' + catSlug) || c.url.includes('/' + catSlug + '/'),
    );
    return currentCat?.children || [];
  });

  readonly displayTitle = computed(() => {
    const sub = this.subCategorySlug();
    const cat = this.categorySlug();

    if (sub) return this.unslugify(sub);
    if (cat) return this.unslugify(cat);
    return this.rootType();
  });

  readonly breadcrumbItems = computed((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: 'Home', url: '/' }];
    const root = this.rootType();
    const cat = this.categorySlug();
    const sub = this.subCategorySlug();

    const url = this.router.url;
    const segments = url.split('/').find((s) => !!s);
    const rootUrl = '/' + segments;
    items.push({
      label: root,
      url: sub || cat ? rootUrl : undefined,
    });

    if (cat) {
      const catLabel = this.unslugify(cat);
      const catUrl = sub ? this.basePath().split('/').slice(0, -1).join('/') : undefined;
      items.push({ label: catLabel, url: catUrl });
    }

    if (sub) {
      items.push({ label: this.unslugify(sub) });
    }

    const page = this.currentPage();
    if (page > 1) {
      const lastItem = items.at(-1);
      if (lastItem) {
        lastItem.url = this.basePath();
      }
      items.push({ label: `Page ${page}` });
    }

    return items;
  });

  onPageChange(p: number): void {
    this.router.navigateByUrl(this.getPageUrl(p));
    this.window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageUrl(p: number): string {
    const base = this.basePath();
    return p === 1 ? base : `${base}/page/${p}`;
  }

  private unslugify(slug: string): string {
    return deslugify(slug);
  }
}
