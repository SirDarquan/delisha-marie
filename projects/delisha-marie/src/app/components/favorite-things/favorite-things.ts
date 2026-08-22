import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { MatCard, MatCardContent } from '@angular/material/card';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-favorite-things',
  imports: [RouterLink, NgOptimizedImage, MatCard, MatCardContent],
  template: `
    @if (favorites().length > 0) {
      <div class="mt-16 space-y-8">
        <h2 class="text-3xl font-bold font-serif text-[var(--mat-sys-primary)]">
          My favorite things!
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          @for (recipe of favorites(); track recipe.slug) {
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
                </mat-card-content>
              </mat-card>
            </a>
          }
        </div>
      </div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteThings {
  private readonly recipeService = inject(RecipeService);

  private readonly _favoritesResource = resource({
    loader: () => this.recipeService.getFavoriteRecipes().then((res) => res.items),
  });

  protected readonly favorites = computed(() => this._favoritesResource.value() || []);
}
