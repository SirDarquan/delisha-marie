import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ViewEncapsulation,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Stars } from '@dm/library';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-top-rated-recipes',
  imports: [MatCardModule, MatIconModule, NgOptimizedImage, RouterLink, Stars],
  template: `
    @if (recipes().length === 4) {
      <section
        class="bg-[var(--mat-sys-secondary-container)] w-[100vw] relative left-[calc(-50vw+50%)] py-12 mb-12">
        <div class="container mx-auto px-4">
          <div class="flex items-end justify-between mb-10 gap-4">
            <div>
              <h2
                class="text-4xl font-bold mb-2 hover:text-[var(--mat-sys-primary)] transition-colors">
                Top Rated Recipes
              </h2>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            @for (recipe of recipes(); track recipe.id; let i = $index) {
              <a
                [routerLink]="['/recipe', recipe.slug]"
                class="block no-underline text-inherit relative">
                <mat-card
                  class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border-none overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl group h-full flex flex-col relative z-0">
                  <div class="relative h-64 overflow-hidden shrink-0">
                    <img
                      [ngSrc]="recipe.image"
                      width="352"
                      height="256"
                      [alt]="recipe.title"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div
                      class="absolute top-0 left-4 text-[var(--mat-sys-primary)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] font-black text-[64px] leading-none pointer-events-none select-none z-10">
                      #{{ i + 1 }}
                    </div>
                  </div>

                  <mat-card-content
                    class="!p-6 flex-grow flex flex-col justify-between relative gap-4">
                    <h3
                      class="text-2xl font-bold mb-0 line-clamp-2 group-hover:text-[var(--mat-sys-primary)] transition-colors relative z-10">
                      {{ recipe.title }}
                    </h3>
                    <div class="flex items-center gap-1">
                      <dml-stars [rating]="recipe.ratingCount" />
                      <span class="font-bold text-sm">{{ recipe.ratingCount }} stars</span>
                      <span class="text-xs text-gray-500 ml-1"
                        >({{ recipe.reviewCount }} ratings)</span
                      >
                    </div>
                  </mat-card-content>
                </mat-card>
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopRatedRecipes {
  private readonly recipeService = inject(RecipeService);

  private readonly _recipeResource = resource({
    loader: () =>
      this.recipeService.getRecipes(1, 20, 'the-best-recipes', undefined, undefined, true),
  });

  readonly recipes = computed(() => {
    const all = this._recipeResource.value()?.items || [];
    return all.filter((r) => r.ratingCount > 4.5).slice(0, 4);
  });
}
