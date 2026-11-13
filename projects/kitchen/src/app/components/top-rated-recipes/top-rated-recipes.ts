import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ViewEncapsulation,
} from '@angular/core';
import { RecipeCard } from '../recipe-card/recipe-card';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-top-rated-recipes',
  imports: [RecipeCard],
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
              <dm-recipe-card [recipe]="recipe" variant="ranked-stars" [rank]="i + 1" />
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
    loader: async () => {
      try {
        return await this.recipeService.getRecipes(1, 20, 'recipes', undefined, undefined, true);
      } catch {
        return { items: [], total: 0 };
      }
    },
  });

  readonly recipes = computed(() => {
    const all = this._recipeResource.value()?.items || [];
    return all.filter((r) => r.rating >= 4.5).slice(0, 4);
  });
}
