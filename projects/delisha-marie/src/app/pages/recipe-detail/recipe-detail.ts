import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Breadcrumbs, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { RecipeHero } from './recipe-hero';
import { Recipe, RecipeService } from '../../services/recipe.service';
import { slugify } from '../../utils/slug';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Sidebar } from '../../components/sidebar/sidebar';
import { SidebarQuickView } from '../../components/sidebar/sidebar-quick-view';
import { RecipeCard } from './recipe-card';
import { RecipeNavigation } from './recipe-navigation';
import { RecipeComments } from './recipe-comments';
import { RecipeMeta } from './recipe-meta';

@Component({
  selector: 'dm-recipe-detail',
  imports: [
    CommonModule,
    Breadcrumbs,
    RecipeHero,
    MatIconModule,
    MatButtonModule,
    Sidebar,
    SidebarQuickView,
    RecipeCard,
    RecipeNavigation,
    RecipeComments,
    RecipeMeta,
  ],
  template: `
    <div class="into-the-box pt-12 pb-12">
      <!-- Breadcrumbs -->
      <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8 px-4 sm:px-0 mt-4 sm:mt-0" />

      @if (recipe(); as r) {
        <dml-recipe-meta [recipe]="r" class="block mb-8 px-4 sm:px-0" />

        <article class="w-full">
          <!-- Hero Section -->
          <dml-recipe-hero [recipe]="r" />

          <!-- Story & Metrics Area -->
          <div class="max-w-7xl mx-auto sm:px-4 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Main Content Area -->
              <div class="flex-1 space-y-12">
                <!-- Recipe Story (The Content) -->
                @if (r.content) {
                  <section class="prose prose-lg max-w-none px-4 sm:px-0 py-8 sm:py-0">
                    <div
                      class="recipe-story text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] leading-relaxed font-serif first-letter:text-6xl first-letter:font-black first-letter:mr-1 first-letter:text-[var(--mat-sys-primary)]"
                      [innerHTML]="r.content"></div>
                  </section>
                }

                <!-- Premium Recipe Card -->
                <dml-recipe-card [recipe]="r" />

                <!-- Recipe Navigation -->
                <dml-recipe-navigation [previous]="r.navigation.prev" [next]="r.navigation.next" />

                <!-- Comments Section -->
                <dml-recipe-comments [recipe]="r" [page]="page()" />
              </div>

              <!-- Sidebar -->
              <aside class="w-full lg:w-[350px] shrink-0">
                <dml-sidebar>
                  <div class="sticky top-24">
                    <dm-sidebar-quick-view [recipe]="r" />
                  </div>
                </dml-sidebar>
              </aside>
            </div>
          </div>
        </article>
      } @else {
        <div class="py-40 text-center max-w-xl mx-auto">
          <mat-icon class="text-9xl h-auto w-auto opacity-10 mb-8 text-[var(--mat-sys-primary)]"
            >search_off</mat-icon
          >
          <h2 class="text-5xl font-black tracking-tighter mb-4">Recipe not found</h2>
          <p class="text-xl text-[var(--mat-sys-on-surface-variant)] mb-12 font-medium">
            Sorry, the culinary masterpiece you're looking for seems to have vanished from our
            kitchen.
          </p>
          <a
            mat-flat-button
            routerLink="/recipe-index"
            class="h-14 px-10 rounded-full text-lg font-bold">
            Back to Recipe Index
          </a>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .recipe-story p {
        margin-bottom: 2.5rem;
      }
      .recipe-story p:last-child {
        margin-bottom: 0;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetail {
  // Input from resolver
  recipe = input<Recipe | null>(null);
  slug = input<string>();
  page = input<string>();

  readonly breadcrumbItems = computed((): BreadcrumbItem[] => {
    const r = this.recipe();
    const items: BreadcrumbItem[] = [
      { label: 'Home', url: '/' },
      { label: 'Recipes', url: '/recipes' },
    ];

    if (!r) return items;

    // Add Category
    if (r.category) {
      const categorySlug = slugify(r.category);
      items.push({
        label: r.category,
        url: `/recipes/${categorySlug}`,
      });

      // Add Subcategory if present
      if (r.subcategory) {
        const subcategorySlug = slugify(r.subcategory);
        items.push({
          label: r.subcategory,
          url: `/recipes/${categorySlug}/${subcategorySlug}`,
        });
      }
    }

    // Add Recipe Name (last item, no URL)
    items.push({ label: r.title });

    return items;
  });

  private readonly recipeService = inject(RecipeService);
  readonly allRecipes = this.recipeService.recipes;

  readonly navigation = computed(() => {
    const r = this.recipe();
    const all = this.allRecipes();
    if (!r || all.length === 0) return { prev: null, next: null, index: -1 };

    const index = all.findIndex((x) => x.slug === r.slug);
    if (index === -1) return { prev: null, next: null, index: -1 };

    return {
      prev: index > 0 ? { title: all[index - 1].title, slug: all[index - 1].slug } : null,
      next:
        index < all.length - 1 ? { title: all[index + 1].title, slug: all[index + 1].slug } : null,
      index,
    };
  });
}
