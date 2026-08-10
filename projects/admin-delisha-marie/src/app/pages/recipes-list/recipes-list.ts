import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  OnInit,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Stars } from '@dm/library';
import { debounceTime, skip } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { CreateRecipeDialogComponent } from '../../components/create-recipe-dialog/create-recipe-dialog';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipes-list',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    ScrollingModule,
    Stars,
    MatBadgeModule,
    NgOptimizedImage,
  ],
  template: `
    <div class="p-4 md:p-8">
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Recipe Directory</h1>
          <p class="text-slate-400 text-xs font-medium mt-1">Manage and edit your recipes</p>
        </div>
      </div>

      <main
        class="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-md">
        <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div class="flex-1 max-w-md">
            <label for="search" class="sr-only">Search recipes</label>
            <input
              id="search"
              type="text"
              placeholder="Search by title, category..."
              [value]="searchTerm()"
              (input)="onSearchChange($event)"
              class="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
          </div>
          <button
            type="button"
            (click)="onCreateRecipe()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition shadow-lg cursor-pointer">
            + New Recipe
          </button>
        </div>

        <div class="border border-slate-800/60 rounded-xl overflow-hidden">
          <div class="w-full text-left bg-slate-900" role="table" aria-label="List of all recipes">
            <!-- Table Header -->
            <div role="row" class="flex bg-slate-800/60 border-b border-slate-800">
              <div
                role="columnheader"
                class="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Title
              </div>
              <div
                role="columnheader"
                class="w-32 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Status
              </div>
              <div
                role="columnheader"
                class="w-56 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Rating
              </div>
              <div
                role="columnheader"
                class="w-32 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Review
              </div>
              <div
                role="columnheader"
                class="w-40 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Actions
              </div>
            </div>

            <!-- Virtual Scroll Viewport -->
            <cdk-virtual-scroll-viewport
              itemSize="48"
              class="h-[calc(100vh-370px)] w-full"
              (scrolledIndexChange)="onScroll()">
              <div class="divide-y divide-slate-800/40">
                <div
                  *cdkVirtualFor="let recipe of recipes(); trackBy: trackByRecipeId"
                  role="row"
                  class="flex items-center hover:bg-slate-800/20 transition h-[48px]"
                  [class.bg-purple-900/20]="recipe.id === highlightedRecipeId()">
                  <div role="cell" class="flex-1 px-4 flex items-center gap-3 overflow-hidden">
                    @if (recipe.image) {
                      <img
                        [ngSrc]="recipe.image"
                        width="44"
                        height="44"
                        alt=""
                        class="w-11 h-11 object-cover rounded-lg border border-slate-700/50 bg-slate-800 flex-shrink-0" />
                    }
                    <strong class="text-sm font-semibold text-white truncate">{{
                      recipe.title
                    }}</strong>
                  </div>

                  <div role="cell" class="w-32 px-4 text-sm">
                    @let stat = recipe.status || 'draft';
                    <span
                      class="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide capitalize"
                      [class.bg-slate-950]="stat === 'draft'"
                      [class.text-slate-300]="stat === 'draft'"
                      [class.bg-orange-500/10]="stat === 'scheduled'"
                      [class.text-orange-400]="stat === 'scheduled'"
                      [class.bg-green-500/10]="stat === 'published'"
                      [class.text-green-400]="stat === 'published'"
                      [class.bg-blue-500/10]="stat === 'updated'"
                      [class.text-blue-400]="stat === 'updated'">
                      {{ stat }}
                    </span>
                  </div>

                  <div role="cell" class="w-56 px-4 text-sm text-slate-300 flex items-center gap-2">
                    <dml-stars [rating]="recipe.ratingCount || 0" [interactive]="false"></dml-stars>
                    <span class="text-xs font-medium">({{ recipe.topCommentsCount || 0 }})</span>
                  </div>

                  <div role="cell" class="w-32 px-4 text-sm">
                    <button
                      mat-button
                      [disabled]="
                        recipe.status === 'draft' ||
                        recipe.status === 'scheduled' ||
                        !recipe.newCommentsCount
                      "
                      [routerLink]="['/recipes', recipe.id, 'comments']"
                      [matBadge]="recipe.newCommentsCount || null"
                      matBadgeColor="accent"
                      [matBadgeHidden]="!recipe.newCommentsCount"
                      class="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      Edit Review
                    </button>
                  </div>

                  <div role="cell" class="w-40 px-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <a
                        mat-icon-button
                        [routerLink]="['/recipes/edit', recipe.id]"
                        (click)="setLastActiveRecipe(recipe.id)"
                        class="!w-7 !h-7 !p-0 flex items-center justify-center !text-white hover:!text-purple-400 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all cursor-pointer"
                        aria-label="Edit recipe">
                        <mat-icon class="text-[16px] h-4 w-4 flex items-center justify-center"
                          >edit</mat-icon
                        >
                      </a>
                      <button
                        mat-icon-button
                        [disabled]="recipe.status === 'published' || recipe.status === 'updated'"
                        (click)="onDelete(recipe.id)"
                        class="!w-7 !h-7 !p-0 flex items-center justify-center !text-white hover:!text-rose-400 hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!text-white disabled:hover:drop-shadow-none"
                        aria-label="Delete recipe">
                        <mat-icon class="text-[16px] h-4 w-4 flex items-center justify-center"
                          >delete</mat-icon
                        >
                      </button>
                    </div>
                  </div>
                </div>

                @if (recipes().length === 0 && !isLoading()) {
                  <div class="p-8 text-center text-slate-400 font-medium text-sm">
                    No recipes found. Try a different search term.
                  </div>
                }

                @if (isLoading()) {
                  <div class="p-6 flex items-center justify-center space-x-3 text-slate-400">
                    <svg
                      class="animate-spin h-5 w-5 text-indigo-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-sm font-medium">Fetching recipes...</span>
                  </div>
                }
              </div>
            </cdk-virtual-scroll-viewport>
          </div>
        </div>
      </main>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesListComponent implements OnInit {
  private readonly recipeService = inject(RecipeService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly viewport = viewChild<CdkVirtualScrollViewport>(CdkVirtualScrollViewport);

  protected readonly searchTerm = signal<string>('');
  protected readonly highlightedRecipeId = signal<string | number | null>(null);

  protected readonly recipes = signal<Recipe[]>(this.recipeService.getCachedRecipesList());
  protected readonly isLoading = signal<boolean>(false);
  private hasMore = true;
  private offset = this.recipes().length;
  private readonly limit = 50;

  constructor() {
    toObservable(this.searchTerm)
      .pipe(skip(1), debounceTime(500), takeUntilDestroyed())
      .subscribe(() => {
        this.recipes.set([]);
        this.offset = 0;
        this.hasMore = true;
        this.fetchNextBatch();
      });

    afterNextRender(() => {
      // CDK Virtual Scroll needs a moment to measure its container size
      setTimeout(() => {
        const lastActiveId = this.recipeService.getLastActiveRecipeId();
        const lastOffset = this.recipeService.getLastScrollOffset();
        const vp = this.viewport();

        if (vp) {
          // Measure the viewport BEFORE scrolling so it knows how many items to render!
          vp.checkViewportSize();

          if (lastActiveId) {
            const index = this.recipes().findIndex((r) => r.id === lastActiveId);
            if (index !== -1) {
              vp.scrollToIndex(index);
              this.highlightedRecipeId.set(lastActiveId);
            }
          } else if (lastOffset > 0) {
            vp.scrollToOffset(lastOffset);
          }

          // Force angular to flush the newly created embedded views
          this.cdr.detectChanges();
        }
      }, 50);
    });

    this.destroyRef.onDestroy(() => {
      // Save scroll state when navigating away
      const vp = this.viewport();
      if (vp) {
        this.recipeService.setLastScrollOffset(vp.measureScrollOffset());
      }
      this.recipeService.setCachedRecipesList(this.recipes());
    });
  }

  ngOnInit(): void {
    if (this.recipes().length === 0) {
      this.fetchNextBatch();
    }
  }

  async fetchNextBatch(): Promise<void> {
    if (this.isLoading() || !this.hasMore) return;

    this.isLoading.set(true);
    try {
      const term = this.searchTerm().trim();
      const data = await this.recipeService.fetchRecipes(this.offset, this.limit, term);
      if (data.length < this.limit) {
        this.hasMore = false;
      }
      this.recipes.update((list) => [...list, ...data]);
      this.offset += data.length;
    } catch (err) {
      console.error('Failed to load recipes', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onScroll(): void {
    const end = this.viewport()?.getRenderedRange().end;
    const total = this.recipes().length;
    // Fetch more when we are within 10 items of the end
    if (end && end >= total - 10) {
      this.fetchNextBatch();
    }

    // Virtual Scroll programmatic updates can happen outside CD in zoneless Angular.
    // Ensure we trigger CD when the viewport scrolls to render new virtual items!
    this.cdr.detectChanges();
  }

  trackByRecipeId(_index: number, recipe: { id: string | number }): string | number {
    return recipe.id;
  }

  setLastActiveRecipe(id: string | number): void {
    this.recipeService.setLastActiveRecipeId(id);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onCreateRecipe(): void {
    this.dialog
      .open(CreateRecipeDialogComponent)
      .afterClosed()
      .subscribe((newRecipe) => {
        if (newRecipe) {
          this.recipes.update((list) => [newRecipe, ...list]);
          this.recipeService.setCachedRecipesList(this.recipes());
        }
      });
  }

  onDelete(id: string | number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Recipe',
        message: 'Are you sure you want to delete this recipe? This action cannot be undone.',
        stayLabel: 'Cancel',
        leaveLabel: 'Delete',
        icon: 'delete_forever',
      },
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.recipeService.deleteRecipe(id);
        this.recipes.update((list) => list.filter((r) => r.id !== id));
        this.recipeService.setCachedRecipesList(this.recipes());
      }
    });
  }
}
