import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Breadcrumbs, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { RecipeHero } from '../../components/recipe-hero/recipe-hero';
import { Recipe } from '../../services/recipe.service';
import { slugify } from '../../utils/slug';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'dm-recipe-detail',
  imports: [CommonModule, Breadcrumbs, RecipeHero, MatIconModule, MatButtonModule, Sidebar],
  template: `
    <div class="into-the-box pt-12 pb-20">
      <!-- Breadcrumbs -->
      <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8" />

      @if (recipe(); as r) {
        <article class="w-full">
          <!-- Hero Section -->
          <dml-recipe-hero [recipe]="r" />

          <!-- Story & Metrics Area -->
          <div class="max-w-7xl mx-auto px-4 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-24">
              <!-- Main Content Area -->
              <div class="flex-1 space-y-20">
                <!-- Recipe Story (The Content) -->
                @if (r.content) {
                  <section class="prose prose-lg max-w-none">
                    <div
                      class="recipe-story text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] leading-relaxed font-serif first-letter:text-6xl first-letter:font-black first-letter:mr-1 first-letter:text-[var(--mat-sys-primary)]"
                      [innerHTML]="r.content"></div>
                  </section>
                }

                <!-- Metrics Bar (No borders) -->
                <div class="flex items-center justify-center gap-12 text-sm font-bold py-8">
                  <div class="flex flex-col items-center gap-1 text-center">
                    <span
                      class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]"
                      >Prep</span
                    >
                    <span class="text-lg font-black">{{ r.prepTime }}</span>
                  </div>
                  <div class="flex flex-col items-center gap-1 text-center">
                    <span
                      class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]"
                      >Cook</span
                    >
                    <span class="text-lg font-black">{{ r.cookTime }}</span>
                  </div>
                  <div class="flex flex-col items-center gap-1 text-center">
                    <span
                      class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]"
                      >Total</span
                    >
                    <span class="text-lg font-black text-[var(--mat-sys-primary)]">{{
                      r.totalTime
                    }}</span>
                  </div>
                  <div class="flex flex-col items-center gap-1 text-center">
                    <span
                      class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]"
                      >Serves</span
                    >
                    <span class="text-lg font-black">{{ r.yield || r.servings }}</span>
                  </div>
                </div>

                <!-- Ingredients & Instructions Grid -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-12">
                  <!-- Ingredients -->
                  <div class="md:col-span-5 lg:col-span-4">
                    <div class="bg-[var(--mat-sys-surface-container)] p-8 rounded-[2.5rem]">
                      <h2 class="text-2xl font-black mb-8 flex items-center gap-3">
                        <mat-icon class="text-[var(--mat-sys-primary)]">shopping_basket</mat-icon>
                        Ingredients
                      </h2>
                      <ul class="space-y-4">
                        @for (ingredient of r.ingredients; track ingredient) {
                          <li
                            class="flex gap-3 text-[var(--mat-sys-on-surface-variant)] font-medium leading-tight">
                            <mat-icon
                              class="text-sm w-4 h-4 text-[var(--mat-sys-primary)] shrink-0 mt-1"
                              >check_circle</mat-icon
                            >
                            {{ ingredient }}
                          </li>
                        }
                      </ul>

                      @if (r.nutrition) {
                        <div class="mt-12 pt-8">
                          <h3
                            class="text-xs font-black uppercase tracking-widest text-[var(--mat-sys-primary)] mb-6">
                            Nutrition Facts
                          </h3>
                          <div class="grid grid-cols-2 gap-4">
                            <div class="bg-white/50 p-4 rounded-2xl">
                              <span class="block text-[10px] uppercase font-bold text-gray-500"
                                >Calories</span
                              >
                              <span class="text-lg font-black">{{ r.nutrition.calories }}</span>
                            </div>
                            <div class="bg-white/50 p-4 rounded-2xl">
                              <span class="block text-[10px] uppercase font-bold text-gray-500"
                                >Protein</span
                              >
                              <span class="text-lg font-black">{{ r.nutrition.protein }}</span>
                            </div>
                            <div class="bg-white/50 p-4 rounded-2xl">
                              <span class="block text-[10px] uppercase font-bold text-gray-500"
                                >Fat</span
                              >
                              <span class="text-lg font-black">{{ r.nutrition.fat }}</span>
                            </div>
                            <div class="bg-white/50 p-4 rounded-2xl">
                              <span class="block text-[10px] uppercase font-bold text-gray-500"
                                >Carbs</span
                              >
                              <span class="text-lg font-black">{{
                                r.nutrition.carbohydrates
                              }}</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Instructions -->
                  <div class="md:col-span-7 lg:col-span-8 space-y-12">
                    <section>
                      <h2 class="text-4xl font-black mb-10 flex items-center gap-4">
                        <mat-icon class="text-[var(--mat-sys-primary)] scale-125"
                          >restaurant_menu</mat-icon
                        >
                        Instructions
                      </h2>
                      <div class="space-y-10">
                        @for (step of r.instructions; track step; let i = $index) {
                          <div class="flex gap-8 group">
                            <div class="shrink-0 flex flex-col items-center gap-4">
                              <div
                                class="w-12 h-12 rounded-full bg-[var(--mat-sys-primary)] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                                {{ i + 1 }}
                              </div>
                            </div>
                            <div class="pb-10">
                              <p
                                class="text-xl text-[var(--mat-sys-on-surface-variant)] leading-relaxed font-medium">
                                {{ step }}
                              </p>
                            </div>
                          </div>
                        }
                      </div>
                    </section>

                    @if (r.notes && r.notes.length > 0) {
                      <section
                        class="bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] p-10 rounded-[3rem] relative overflow-hidden">
                        <mat-icon class="absolute -top-4 -right-4 text-6xl opacity-10 scale-[3]"
                          >lightbulb</mat-icon
                        >
                        <h3 class="text-2xl font-black mb-6">Chef's Notes</h3>
                        <ul class="space-y-4">
                          @for (note of r.notes; track note) {
                            <li class="flex gap-3 font-medium opacity-90">
                              <span class="text-xl">•</span>
                              {{ note }}
                            </li>
                          }
                        </ul>
                      </section>
                    }
                  </div>
                </div>
              </div>

              <!-- Sidebar -->
              <aside class="w-full lg:w-[350px] shrink-0">
                <dml-sidebar />
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
}
