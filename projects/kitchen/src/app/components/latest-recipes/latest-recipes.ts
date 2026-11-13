import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  resource,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { RecipeGrid } from '../recipe-grid/recipe-grid';
import { Recipe, RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-latest-recipes',
  imports: [RecipeGrid],
  template: `
    <section class="space-y-8" id="latest-recipes">
      @if (showSectionTitle()) {
        <div class="flex items-end justify-between gap-4">
          <div>
            <h5
              class="text-sm font-bold tracking-widest uppercase text-[var(--mat-sys-primary)] mb-1">
              Fresh From The Oven
            </h5>
            <h2 class="text-4xl font-black font-serif text-[var(--mat-sys-on-surface)]">
              Latest Recipes
            </h2>
          </div>
        </div>
      }

      <dm-recipe-grid
        [recipes]="recipes()"
        [columns]="3"
        [variant]="'individual-links'"
        [pageSize]="pageSize()"
        [currentPage]="page()"
        [totalItems]="totalItems()"
        [isLoading]="isLoading()"
        [showPagination]="true"
        [emptyMessage]="'No recipes found at this time. Check back soon!'"
        (pageChange)="onPageChange($event)" />
    </section>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestRecipes {
  readonly page = input<number>(1);
  readonly pageSize = input<number>(6);
  readonly showSectionTitle = input<boolean>(true);

  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);

  private readonly _recipeResource = resource({
    params: () => ({ page: this.page(), pageSize: this.pageSize() }),
    loader: async ({ params }) => {
      try {
        return await this.recipeService.getRecipes(params.page, params.pageSize, 'recipes');
      } catch {
        return { items: [], total: 0 };
      }
    },
  });

  // Keep previous items displayed to prevent flashing skeletons on page turn
  private readonly _cachedItems = signal<Recipe[]>([]);
  private readonly _cachedTotal = signal<number>(0);

  readonly recipes = computed(() => {
    const val = this._recipeResource.value();
    if (val?.items && val.items.length > 0) {
      return val.items;
    }
    return this._cachedItems();
  });

  readonly totalItems = computed(() => {
    const val = this._recipeResource.value();
    if (val && typeof val.total === 'number') {
      return val.total;
    }
    return this._cachedTotal();
  });

  readonly isLoading = () => this._recipeResource.isLoading();
  readonly isInitialLoading = computed(() => this.isLoading() && this.recipes().length === 0);
  readonly isPageChanging = computed(() => this.isLoading() && this.recipes().length > 0);

  constructor() {
    effect(() => {
      const val = this._recipeResource.value();
      if (val?.items) {
        this._cachedItems.set(val.items);
        this._cachedTotal.set(val.total || 0);

        // Quietly prefetch the next page in the background on browser
        if (
          isPlatformBrowser(this.platformId) &&
          (val.total || 0) > this.page() * this.pageSize()
        ) {
          this.recipeService.prefetchRecipes(this.page() + 1, this.pageSize(), 'recipes');
        }
      }
    });
  }

  onPageChange(newPage: number): void {
    const targetUrl = newPage === 1 ? '/' : `/page/${newPage}`;
    void this.router.navigateByUrl(targetUrl);
    if (
      isPlatformBrowser(this.platformId) &&
      typeof this.elementRef.nativeElement?.scrollIntoView === 'function'
    ) {
      this.elementRef.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }
}
