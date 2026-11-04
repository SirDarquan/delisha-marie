import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  resource,
  ViewEncapsulation,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-latest-recipes',
  imports: [MatCardModule, NgOptimizedImage, RouterLink, NgxPaginationModule],
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

      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (placeholder of [1, 2, 3, 4, 5, 6]; track placeholder) {
            <mat-card
              class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border border-[var(--mat-sys-outline-variant)] overflow-hidden animate-pulse flex flex-col h-full">
              <div class="aspect-[16/10] bg-[var(--mat-sys-surface-container-highest)]"></div>
              <mat-card-content class="!p-6 space-y-3 flex-grow">
                <div class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-1/3"></div>
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
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (
            recipe of recipes()
              | paginate
                : {
                    itemsPerPage: pageSize(),
                    currentPage: page(),
                    totalItems: totalItems(),
                  };
            track recipe.id || recipe.slug || $index
          ) {
            <mat-card
              class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border border-[var(--mat-sys-outline-variant)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group flex flex-col h-full">
              <div
                class="relative aspect-[16/10] overflow-hidden bg-[var(--mat-sys-surface-container-highest)]">
                <a
                  [routerLink]="['/recipe', recipe.slug]"
                  class="block w-full h-full"
                  [attr.aria-label]="recipe.title">
                  <img
                    [ngSrc]="recipe.image"
                    fill
                    [priority]="$index < 3"
                    [alt]="recipe.title"
                    height="auto"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </a>
              </div>

              <mat-card-content class="!p-6 flex-grow flex flex-col">
                @if (recipe.location && recipe.locationName) {
                  <a
                    [routerLink]="recipe.location"
                    class="inline-block text-xs font-bold tracking-wider uppercase text-[var(--mat-sys-primary)] hover:underline mb-2">
                    {{ recipe.locationName }}
                  </a>
                }

                <a [routerLink]="['/recipe', recipe.slug]" class="block mb-3">
                  <h3
                    class="text-xl font-bold font-serif line-clamp-2 text-[var(--mat-sys-on-surface)] group-hover:text-[var(--mat-sys-primary)] transition-colors leading-snug">
                    {{ recipe.title }}
                  </h3>
                </a>

                <p
                  class="text-sm text-[var(--mat-sys-on-surface-variant)] line-clamp-3 leading-relaxed flex-grow">
                  {{ recipe.description }}
                </p>
              </mat-card-content>
            </mat-card>
          } @empty {
            <div class="col-span-full py-16 text-center text-[var(--mat-sys-on-surface-variant)]">
              No recipes found at this time. Check back soon!
            </div>
          }
        </div>

        @if (totalItems() > pageSize()) {
          <div class="flex justify-center pt-8 pb-4">
            <pagination-controls
              (pageChange)="onPageChange($event)"
              [responsive]="true"
              class="recipe-pagination">
            </pagination-controls>
          </div>
        }
      }
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

  readonly recipes = () => this._recipeResource.value()?.items || [];
  readonly totalItems = () => this._recipeResource.value()?.total || 0;
  readonly isLoading = () => this._recipeResource.isLoading();

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
