import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ViewEncapsulation,
} from '@angular/core';
import { RecipeCard } from '@dm/library';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-favorite-things',
  imports: [RecipeCard],
  template: `
    @if (favorites().length > 0) {
      <div class="mt-16 space-y-8">
        <h2 class="text-3xl font-bold font-serif text-[var(--mat-sys-primary)]">
          My favorite things!
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          @for (recipe of favorites(); track recipe.slug) {
            <dml-recipe-card [recipe]="recipe" variant="card-link" />
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
    loader: () =>
      this.recipeService
        .getFavoriteRecipes()
        .then((res) => res.items)
        .catch(() => []),
  });

  protected readonly favorites = computed(() => this._favoritesResource.value() || []);
}
