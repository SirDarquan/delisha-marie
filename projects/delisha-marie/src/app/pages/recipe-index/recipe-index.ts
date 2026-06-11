import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  signal,
  inject,
  computed,
  resource,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Breadcrumbs, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { RecipeIndexCategoryImages } from './recipe-index-category-images';
import { RecipeIndexMethodImages } from './recipe-index-method-images';
import { RecipeIndexService } from './recipe-index.service';
import { RecipeIndexLinkList } from './recipe-index-link-list';
import { RecipeIndexIngredients } from './recipe-index-ingredients';


@Component({
  selector: 'dm-recipe-index',
  imports: [
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

        <header class="mb-16 pt-8">
          <h1
            id="index-title"
            class="text-6xl md:text-7xl font-extrabold tracking-tighter text-[var(--mat-sys-on-surface)] mat-headline-medium">
            Recipe <span class="text-[var(--mat-sys-primary)]">Index</span>
          </h1>
          <div class="h-1.5 w-24 bg-[var(--mat-sys-primary)] mt-6 rounded-full"></div>
        </header>
      </div>

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
