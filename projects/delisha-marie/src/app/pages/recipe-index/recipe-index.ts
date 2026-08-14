import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbItem, Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';
import { RecipeIndexCategoryImages } from './recipe-index-category-images';
import { RecipeIndexIngredients } from './recipe-index-ingredients';
import { RecipeIndexLinkList } from './recipe-index-link-list';
import { RecipeIndexMethodImages } from './recipe-index-method-images';
import { RecipeIndexService } from './recipe-index.service';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';

@Component({
  selector: 'dm-recipe-index',
  imports: [
    ColoredHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    Breadcrumbs,
    RecipeIndexCategoryImages,
    RecipeIndexMethodImages,
    RecipeIndexLinkList,
    RecipeIndexIngredients,
  ],
  template: `
    <main class="py-12" aria-labelledby="index-title">
      <div class="into-the-box">
        <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8" />

        <dm-colored-header title="Recipe Index" size="small" />
      </div>

      @if (isLoading()) {
        <!-- Skeleton for Category Images Breakout -->
        <section
          class="break-out bg-[var(--mat-sys-surface-container-low)] pt-16 pb-12 mb-20 border-y border-[var(--mat-sys-outline-variant)]">
          <div class="into-the-box">
            <div class="mb-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
              @for (placeholder of [1, 2, 3, 4, 5, 6, 7, 8]; track placeholder) {
                <div class="flex flex-col items-center">
                  <div
                    class="w-full aspect-square rounded-2xl bg-[var(--mat-sys-surface-container-highest)] animate-pulse"></div>
                  <div class="py-4 w-full flex justify-center">
                    <div
                      class="h-3 w-16 bg-[var(--mat-sys-surface-container-highest)] rounded animate-pulse"></div>
                  </div>
                </div>
              }
            </div>
            <!-- Skeleton for Search Bar -->
            <div
              class="max-w-md mx-auto h-14 bg-[var(--mat-sys-surface-container-highest)] rounded-full animate-pulse"></div>
          </div>
        </section>

        <!-- Skeleton for Method Images -->
        <section class="mb-20">
          <div class="into-the-box">
            <header class="mb-10 text-left">
              <div
                class="h-10 w-64 bg-[var(--mat-sys-surface-container-highest)] rounded animate-pulse"></div>
              <div class="h-1 w-16 bg-[var(--mat-sys-primary)] mt-4 rounded-full opacity-50"></div>
            </header>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              @for (placeholder of [1, 2, 3]; track placeholder) {
                <div class="flex flex-col items-center">
                  <div
                    class="w-full aspect-[4/3] rounded-2xl bg-[var(--mat-sys-surface-container-highest)] animate-pulse"></div>
                  <div class="py-6 w-full flex justify-center">
                    <div
                      class="h-4 w-32 bg-[var(--mat-sys-surface-container-highest)] rounded animate-pulse"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Skeleton for Link Lists -->
        <section class="space-y-4">
          @for (placeholder of [1, 2, 3, 4, 5]; track placeholder) {
            <section class="py-16 bg-[var(--mat-sys-surface)]">
              <div class="into-the-box">
                <header class="mb-10 text-left">
                  <div
                    class="h-10 w-64 bg-[var(--mat-sys-surface-container-highest)] rounded animate-pulse"></div>
                  <div
                    class="h-1 w-16 bg-[var(--mat-sys-primary)] mt-4 rounded-full opacity-50"></div>
                </header>
                <div class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-12">
                  @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
                    <div class="flex flex-col break-inside-avoid mb-2 animate-pulse">
                      <div
                        class="h-6 w-32 bg-[var(--mat-sys-surface-container-highest)] rounded mb-4 mt-2"></div>
                      <ul class="list-none p-0 m-0 space-y-3 mb-2">
                        <li class="pl-6">
                          <div
                            class="h-4 w-24 bg-[var(--mat-sys-surface-container-highest)] rounded"></div>
                        </li>
                        <li class="pl-6">
                          <div
                            class="h-4 w-32 bg-[var(--mat-sys-surface-container-highest)] rounded"></div>
                        </li>
                        <li class="pl-6">
                          <div
                            class="h-4 w-20 bg-[var(--mat-sys-surface-container-highest)] rounded"></div>
                        </li>
                      </ul>
                    </div>
                  }
                </div>
              </div>
            </section>
          }
        </section>
      } @else {
        <!-- Featured Image Sections -->
        <dm-recipe-index-category-images [categories]="featuredCategories()" />
        <dm-recipe-index-method-images [methods]="featuredMethods()" />

        <!-- Full Link Index Sections -->
        <section class="space-y-4">
          <dm-recipe-index-link-list
            [items]="categoriesList()"
            titlePrefix="Recipes By"
            titleHighlight="Category"
            titleId="category-list-title" />

          <dm-recipe-index-link-list
            [items]="methodsList()"
            titlePrefix="Recipes By"
            titleHighlight="Method"
            titleId="methods-list-title" />

          <dm-recipe-index-link-list
            [items]="holidays()"
            titlePrefix="Recipes By"
            titleHighlight="Holiday"
            titleId="holidays-title" />

          <dm-recipe-index-link-list
            [items]="specialDiets()"
            titlePrefix="Special"
            titleHighlight="Diets"
            titleId="diets-title" />

          <dm-recipe-index-link-list
            [items]="bestRecipes()"
            titlePrefix="The Best"
            titleHighlight="Recipes"
            titleId="best-recipes-title" />

          <dm-recipe-index-ingredients [ingredients]="ingredients()" />
        </section>
      }
      <!-- Newsletter CTA -->
      <footer
        class="mt-24 mb-12 p-16 bg-[var(--mat-sys-on-surface)] text-[var(--mat-sys-surface)] rounded-[3rem] text-center space-y-8 relative overflow-hidden group/footer">
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover/footer:bg-white/10 transition-colors duration-500"></div>

        <h2 class="text-4xl md:text-5xl font-black tracking-tight relative z-10">
          Never miss a beat!
        </h2>
        <p class="text-xl max-w-2xl mx-auto opacity-70 font-medium relative z-10">
          Subscribe to get new updates and cooking tips delivered straight to your inbox.
        </p>
        <div class="pt-4 relative z-10">
          <button
            mat-flat-button
            class="!bg-[var(--mat-sys-primary)] !text-white !px-12 !py-8 !text-lg !rounded-2xl !font-bold shadow-2xl hover:scale-105 transition-transform">
            Join the Studio Newsletter
          </button>
        </div>
      </footer>
      <!-- </div> -->
    </main>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIndex {
  private readonly service = inject(RecipeIndexService);

  // Using resource() to fetch the Promise-based index data reactively.
  private readonly _indexResource = resource({
    loader: () => this.service.getData(),
  });

  private readonly _data = computed(() => this._indexResource.value());
  readonly isLoading = computed(() => this._indexResource.isLoading());

  readonly featuredCategories = computed(() => this._data()?.featuredCategories || []);
  readonly featuredMethods = computed(() => this._data()?.cookingMethods || []);
  readonly categoriesList = computed(() => this._data()?.categoriesList || []);
  readonly methodsList = computed(() => this._data()?.methodsList || []);
  readonly holidays = computed(() => this._data()?.holidays || []);
  readonly specialDiets = computed(() => this._data()?.specialDiets || []);
  readonly ingredients = computed(() => this._data()?.ingredients || []);

  readonly bestRecipes = computed(() => this._data()?.bestRecipes || []);

  readonly breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Home', url: '/' },
    { label: 'Recipe Index' },
  ]);
}
