import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { deslugify } from '@dm/library';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-featured-recipes',
  imports: [MatCardModule, MatButtonModule, MatIconModule, NgOptimizedImage, RouterLink],
  template: `
    @if (recipes().length > 0 || _recipeResource.isLoading()) {
      <section>
        <div class="flex items-end justify-between mb-10 gap-4">
          <div>
            @if (special()) {
              <h5
                class="text-1xl font-bold mb-2 hover:text-[var(--mat-sys-primary)] transition-colors">
                {{ special() }}
              </h5>
            }
            <h2
              class="text-4xl font-bold mb-2 hover:text-[var(--mat-sys-primary)] transition-colors">
              {{ title() }}
            </h2>
          </div>
          <div class="hidden md:flex gap-2">
            <a mat-stroked-button [routerLink]="link()" class="!rounded-full">View All</a>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          @for (recipe of recipes(); track recipe.id) {
            <a [routerLink]="['/recipe', recipe.slug]" class="block no-underline text-inherit">
              <mat-card
                class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border-none overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl group">
                <div class="relative h-64 overflow-hidden">
                  <img
                    [ngSrc]="recipe.image"
                    width="352"
                    height="256"
                    [alt]="recipe.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div
                    class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button mat-mini-fab color="primary">
                      <mat-icon>favorite</mat-icon>
                    </button>
                  </div>
                </div>

                <mat-card-content class="!p-6">
                  <h3
                    class="text-2xl font-bold mb-3 line-clamp-1 group-hover:text-[var(--mat-sys-primary)] transition-colors">
                    {{ recipe.title }}
                  </h3>
                  <p
                    class="text-[var(--mat-sys-on-surface-variant)] line-clamp-2 text-sm leading-relaxed">
                    {{ recipe.description }}
                  </p>
                </mat-card-content>

                <mat-card-actions class="!p-6 !pt-0 flex justify-between items-center">
                  <button
                    mat-button
                    [routerLink]="recipe.slug"
                    class="!text-[var(--mat-sys-primary)] font-bold">
                    Read Full Recipe
                  </button>
                </mat-card-actions>
              </mat-card>
            </a>
          }
        </div>
      </section>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedRecipes {
  readonly special = input<string>();
  readonly link = input.required<string>();

  private readonly recipeService = inject(RecipeService);

  readonly categorySlug = computed(() => this.link().split('/')[2]);
  readonly subCategorySlug = computed(() => this.link().split('/')[3]);
  readonly title = computed(() => deslugify(this.subCategorySlug() || this.categorySlug()));

  // Reactive data fetching trigger
  private readonly _dataTrigger = computed(() => {
    const url = this.link();
    const segments = url.split('/').find((s) => !!s);
    return {
      cat: this.categorySlug(),
      sub: this.subCategorySlug(),
      method: segments || 'recipes',
    };
  });

  protected readonly _recipeResource = resource({
    params: () => this._dataTrigger(),
    loader: ({ params: t }) => this.recipeService.getRecipes(1, 4, t.method, t.cat, t.sub),
  });

  readonly recipes = computed(() => this._recipeResource.value()?.items || []);
}
