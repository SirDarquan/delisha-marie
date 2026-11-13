import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbItem, Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';
import { RefineBy, RefineByItem } from '../../components/refine-by/refine-by';
import { Recipe, RecipeService } from '../../services/recipe.service';
import { deslugify } from '@dm/library';
import { RecipeIndexService } from '../recipe-index/recipe-index.service';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';
import { RecipeGrid } from '../../components/recipe-grid/recipe-grid';

@Component({
  selector: 'dm-recipe-list',
  imports: [CommonModule, Breadcrumbs, RefineBy, RecipeGrid, ColoredHeaderComponent],
  template: `
    <div class="into-the-box pt-12 pb-4">
      <!-- Dynamic Breadcrumbs -->
      <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8" />

      <!-- Page Header -->
      <dm-colored-header [title]="displayTitle()" size="small" />

      <!-- SubCategory listing -->
      <dml-refine-by [items]="subCategories()" class="block mb-12" />

      <!-- Recipe Grid -->
      <dm-recipe-grid
        [recipes]="displayedRecipes()"
        [columns]="4"
        [variant]="'card-link'"
        [pageSize]="pageSize"
        [currentPage]="currentPage()"
        [totalItems]="totalItems()"
        [isLoading]="isLoading()"
        [showPagination]="true"
        (pageChange)="onPageChange($event)" />
    </div>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly indexService = inject(RecipeIndexService);
  private readonly document = inject(DOCUMENT);

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

  private readonly _previousRecipes = signal<Recipe[]>([]);
  readonly recipes = computed(() => this._recipeResource.value()?.items || []);
  readonly totalItems = computed(() => this._recipeResource.value()?.total || 0);
  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));
  readonly isLoading = computed(() => this._recipeResource.isLoading());

  readonly displayedRecipes = computed(() => {
    const current = this.recipes();
    if (current.length > 0) return current;
    if (this.isLoading() && this._previousRecipes().length > 0) return this._previousRecipes();
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
    const total = this.totalItems();
    const trigger = this._dataTrigger();
    const pageSize = this.pageSize;

    if (total > trigger.page * pageSize) {
      this.recipeService.prefetchRecipes(
        trigger.page + 1,
        pageSize,
        trigger.method,
        trigger.cat,
        trigger.sub,
      );
    }
  });

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
    const children = currentCat?.children || [];
    return children.filter((sub) => {
      const subSlug = sub.url.split('/').filter(Boolean).pop()?.toLowerCase();
      const parentSlug = catSlug?.toLowerCase();
      const subName = sub.name.trim().toLowerCase();
      const parentName = currentCat?.name?.trim().toLowerCase();
      return subSlug !== parentSlug && subName !== parentName;
    });
  });

  readonly displayTitle = computed(() => {
    const sub = this.subCategorySlug();
    const cat = this.categorySlug();

    if (sub) return deslugify(sub);
    if (cat) return deslugify(cat);
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
      const catLabel = deslugify(cat);
      const catUrl = sub ? this.basePath().split('/').slice(0, -1).join('/') : undefined;
      items.push({ label: catLabel, url: catUrl });
    }

    if (sub) {
      items.push({ label: deslugify(sub) });
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
    void this.router.navigateByUrl(this.getPageUrl(p));
    const window = this.document.defaultView;
    window?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageUrl(p: number): string {
    const base = this.basePath();
    return p === 1 ? base : `${base}/page/${p}`;
  }
}
