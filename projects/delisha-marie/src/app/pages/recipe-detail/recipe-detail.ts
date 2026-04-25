import { Component, ChangeDetectionStrategy, inject, computed, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Breadcrumbs, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { Recipe } from '../../services/recipe.service';
import { slugify } from '../../utils/slug';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'dm-recipe-detail',
  imports: [CommonModule, Breadcrumbs, MatIconModule, MatButtonModule, MatDividerModule, NgOptimizedImage],
  template: `
    <div class="into-the-box pt-12 pb-20">
      <!-- Breadcrumbs -->
      <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8" />

      @if (recipe(); as r) {
        <article class="max-w-4xl mx-auto">
          <!-- Header Section -->
          <header class="mb-12 text-center">
            <div class="flex items-center justify-center gap-2 mb-6">
              <span class="text-xs font-black uppercase tracking-widest text-[var(--mat-sys-primary)]">
                {{ r.course }} • {{ r.cuisine }}
              </span>
              @if (r.theBest) {
                <span class="bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-0.5">
                  <mat-icon class="!text-[10px] !w-auto !h-auto">stars</mat-icon>
                  The Best
                </span>
              }
            </div>
            
            <h1 class="text-5xl md:text-7xl font-black tracking-tighter text-[var(--mat-sys-on-surface)] leading-[0.95] mb-6">
              {{ r.title }}
            </h1>
            
            <p class="text-xl md:text-2xl text-[var(--mat-sys-on-surface-variant)] font-medium leading-relaxed max-w-2xl mx-auto mb-8">
              {{ r.description }}
            </p>

            <div class="flex items-center justify-center gap-8 text-sm font-bold border-y border-[var(--mat-sys-outline-variant)] py-6 mb-12">
              <div class="flex flex-col items-center gap-1">
                <span class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]">Prep</span>
                <span>{{ r.prepTime }}</span>
              </div>
              <div class="h-8 w-px bg-[var(--mat-sys-outline-variant)]"></div>
              <div class="flex flex-col items-center gap-1">
                <span class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]">Cook</span>
                <span>{{ r.cookTime }}</span>
              </div>
              <div class="h-8 w-px bg-[var(--mat-sys-outline-variant)]"></div>
              <div class="flex flex-col items-center gap-1">
                <span class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]">Total</span>
                <span class="text-[var(--mat-sys-primary)]">{{ r.totalTime }}</span>
              </div>
              <div class="h-8 w-px bg-[var(--mat-sys-outline-variant)]"></div>
              <div class="flex flex-col items-center gap-1">
                <span class="text-[var(--mat-sys-on-surface-variant)] uppercase tracking-widest text-[10px]">Serves</span>
                <span>{{ r.yield || r.servings }}</span>
              </div>
            </div>
          </header>

          <!-- Featured Image -->
          <div class="relative aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl mb-20 group">
            <img 
              [ngSrc]="r.image" 
              fill 
              priority 
              [alt]="r.title" 
              class="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          <!-- Recipe Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            <!-- Left Column: Ingredients -->
            <aside class="lg:col-span-4 space-y-12">
              <div class="bg-[var(--mat-sys-surface-container)] p-8 rounded-[2.5rem] sticky top-8">
                <h2 class="text-2xl font-black mb-8 flex items-center gap-3">
                  <mat-icon class="text-[var(--mat-sys-primary)]">shopping_basket</mat-icon>
                  Ingredients
                </h2>
                <ul class="space-y-4">
                  @for (ingredient of r.ingredients; track ingredient) {
                    <li class="flex gap-3 text-[var(--mat-sys-on-surface-variant)] font-medium leading-tight">
                      <mat-icon class="!text-sm !w-4 !h-4 text-[var(--mat-sys-primary)] shrink-0 mt-1">check_circle</mat-icon>
                      {{ ingredient }}
                    </li>
                  }
                </ul>

                @if (r.nutrition) {
                  <div class="mt-12 pt-8 border-t border-[var(--mat-sys-outline-variant)]">
                    <h3 class="text-xs font-black uppercase tracking-widest text-[var(--mat-sys-primary)] mb-6">Nutrition Facts</h3>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-white/50 p-4 rounded-2xl">
                        <span class="block text-[10px] uppercase font-bold text-gray-500">Calories</span>
                        <span class="text-lg font-black">{{ r.nutrition.calories }}</span>
                      </div>
                      <div class="bg-white/50 p-4 rounded-2xl">
                        <span class="block text-[10px] uppercase font-bold text-gray-500">Protein</span>
                        <span class="text-lg font-black">{{ r.nutrition.protein }}</span>
                      </div>
                      <div class="bg-white/50 p-4 rounded-2xl">
                        <span class="block text-[10px] uppercase font-bold text-gray-500">Fat</span>
                        <span class="text-lg font-black">{{ r.nutrition.fat }}</span>
                      </div>
                      <div class="bg-white/50 p-4 rounded-2xl">
                        <span class="block text-[10px] uppercase font-bold text-gray-500">Carbs</span>
                        <span class="text-lg font-black">{{ r.nutrition.carbohydrates }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </aside>

            <!-- Right Column: Instructions -->
            <main class="lg:col-span-8 space-y-12">
              <section>
                <h2 class="text-4xl font-black mb-10 flex items-center gap-4">
                  <mat-icon class="text-[var(--mat-sys-primary)] scale-125">restaurant_menu</mat-icon>
                  Instructions
                </h2>
                <div class="space-y-10">
                  @for (step of r.instructions; track step; let i = $index) {
                    <div class="flex gap-8 group">
                      <div class="shrink-0 flex flex-col items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-[var(--mat-sys-primary)] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                          {{ i + 1 }}
                        </div>
                        @if (i < (r.instructions?.length || 0) - 1) {
                          <div class="w-0.5 flex-1 bg-[var(--mat-sys-outline-variant)]"></div>
                        }
                      </div>
                      <div class="pb-10">
                        <p class="text-xl text-[var(--mat-sys-on-surface-variant)] leading-relaxed font-medium">
                          {{ step }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </section>

              @if (r.notes && r.notes.length > 0) {
                <section class="bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] p-10 rounded-[3rem] relative overflow-hidden">
                   <mat-icon class="absolute -top-4 -right-4 text-6xl opacity-10 scale-[3]">lightbulb</mat-icon>
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
            </main>

          </div>
        </article>
      } @else {
        <div class="py-40 text-center max-w-xl mx-auto">
          <mat-icon class="text-9xl h-auto w-auto opacity-10 mb-8 text-[var(--mat-sys-primary)]">search_off</mat-icon>
          <h2 class="text-5xl font-black tracking-tighter mb-4">Recipe not found</h2>
          <p class="text-xl text-[var(--mat-sys-on-surface-variant)] mb-12 font-medium">
            Sorry, the culinary masterpiece you're looking for seems to have vanished from our kitchen.
          </p>
          <a mat-flat-button routerLink="/recipe-index" class="!h-14 !px-10 !rounded-full !text-lg font-bold">
            Back to Recipe Index
          </a>
        </div>
      }
    </div>
  `,
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
