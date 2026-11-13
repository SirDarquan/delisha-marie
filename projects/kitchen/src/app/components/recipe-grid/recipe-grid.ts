import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxPaginationModule } from 'ngx-pagination';
import { Recipe } from '../../services/recipe.service';
import { RecipeCard, RecipeCardVariant } from '../recipe-card/recipe-card';

@Component({
  selector: 'dm-recipe-grid',
  imports: [MatCardModule, MatIconModule, NgxPaginationModule, RecipeCard],
  template: `
    @if (isInitialLoading()) {
      <div [class]="gridClass()">
        @for (placeholder of skeletonCount(); track placeholder) {
          <mat-card
            class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border border-[var(--mat-sys-outline-variant)] overflow-hidden animate-pulse flex flex-col h-full">
            <div
              [class]="
                columns() === 3
                  ? 'aspect-[16/10] bg-[var(--mat-sys-surface-container-highest)]'
                  : 'aspect-[4/3] bg-[var(--mat-sys-surface-container-highest)]'
              "></div>
            <mat-card-content class="!p-6 space-y-3 flex-grow">
              <div class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-1/3"></div>
              <div class="h-6 bg-[var(--mat-sys-surface-container-highest)] rounded w-3/4"></div>
              <div class="space-y-2 pt-2">
                <div class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-full"></div>
                <div class="h-4 bg-[var(--mat-sys-surface-container-highest)] rounded w-5/6"></div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    } @else {
      <div [class]="gridClass()" [class.opacity-60]="isPageChanging()">
        @for (
          recipe of recipes()
            | paginate
              : {
                  itemsPerPage: pageSize(),
                  currentPage: currentPage(),
                  totalItems: totalItems() > 0 ? totalItems() : recipes().length,
                };
          track recipe.id || recipe.slug || $index;
          let i = $index
        ) {
          <dm-recipe-card
            [recipe]="recipe"
            [variant]="variant()"
            [rank]="startRank() + i"
            [priority]="i < (columns() === 4 ? 8 : 3)" />
        } @empty {
          <div
            class="col-span-full py-16 text-center space-y-4 text-[var(--mat-sys-on-surface-variant)]">
            <mat-icon class="text-6xl h-auto w-auto opacity-20">restaurant_menu</mat-icon>
            <p class="text-xl text-[var(--mat-sys-outline)]">
              {{ emptyMessage() }}
            </p>
          </div>
        }
      </div>

      @if (showPagination() && totalItems() > pageSize()) {
        <div class="flex justify-center pt-8 pb-4">
          <pagination-controls
            (pageChange)="pageChange.emit($event)"
            [responsive]="true"
            class="recipe-pagination">
          </pagination-controls>
        </div>
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeGrid {
  readonly recipes = input<Recipe[]>([]);
  readonly columns = input<2 | 3 | 4>(4);
  readonly variant = input<RecipeCardVariant>('card-link');
  readonly pageSize = input<number>(12);
  readonly currentPage = input<number>(1);
  readonly totalItems = input<number>(0);
  readonly isLoading = input<boolean>(false);
  readonly showPagination = input<boolean>(true);
  readonly emptyMessage = input<string>('No recipes found for this selection.');
  readonly startRank = input<number>(1);

  readonly pageChange = output<number>();

  readonly gridClass = computed(() => {
    switch (this.columns()) {
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 transition-opacity duration-200';
      case 3:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 transition-opacity duration-200';
      case 4:
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 transition-opacity duration-200';
    }
  });

  readonly skeletonCount = computed(() => {
    const size = this.pageSize();
    const count = size > 0 ? Math.min(size, 12) : 6;
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  readonly isInitialLoading = computed(() => this.isLoading() && this.recipes().length === 0);
  readonly isPageChanging = computed(() => this.isLoading() && this.recipes().length > 0);
}
