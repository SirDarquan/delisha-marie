import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    NgOptimizedImage,
    RouterLink,
  ],
  template: `
    <div class="space-y-16">
      <!-- Hero Section -->
      <section class="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
        <img
          ngSrc="delisha_marie_hero_widescreen.png"
          priority
          fill
          alt="Delisha Marie Kitchen"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8 md:p-16">
          <div class="max-w-2xl text-white">
            <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Authentic flavors, <br /><span class="text-[var(--mat-sys-primary)]"
                >Handcrafted</span
              >
              with love.
            </h1>
            <p class="text-xl md:text-2xl font-light mb-8 text-gray-200">
              Join me in my culinary journey as we explore simple yet elegant recipes that bring
              people together.
            </p>
            <a
              mat-flat-button
              routerLink="/recipe-index"
              class="!flex !items-center !justify-center !h-14 !px-10 !rounded-full !text-lg font-bold shadow-lg shadow-red-500/20">
              Browse Latest Recipes
            </a>
          </div>
        </div>
      </section>

      <!-- Featured Recipes Section -->
      <section>
        <div class="flex items-end justify-between mb-10 gap-4">
          <div>
            <h2 class="text-4xl font-bold mb-2">Well Executed Recipes</h2>
            <p class="text-[var(--mat-sys-on-surface-variant)] text-lg">
              Curated collection of my favorite kitchen staples.
            </p>
          </div>
          <div class="hidden md:flex gap-2">
            <button mat-stroked-button class="!rounded-full">All</button>
            <button mat-stroked-button class="!rounded-full">Dinner</button>
            <button mat-stroked-button class="!rounded-full">Dessert</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (recipe of recipes(); track recipe.id) {
            <mat-card
              class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border-none overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl group cursor-pointer">
              <div class="relative h-64 overflow-hidden">
                <img
                  [ngSrc]="recipe.image"
                  width="400"
                  height="256"
                  [alt]="recipe.title"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div class="absolute top-4 left-4">
                  <mat-chip class="!bg-black/50 !text-white backdrop-blur-sm">{{
                    recipe.category
                  }}</mat-chip>
                </div>
                <div
                  class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button mat-mini-fab color="primary">
                    <mat-icon>favorite</mat-icon>
                  </button>
                </div>
              </div>

              <mat-card-content class="!p-6">
                <div
                  class="flex items-center gap-4 text-xs font-bold text-[var(--mat-sys-primary)] mb-3 uppercase tracking-widest">
                  <span class="flex items-center gap-1"
                    ><mat-icon class="!text-sm scale-75">schedule</mat-icon>
                    {{ recipe.cookTime }}</span
                  >
                  <span class="flex items-center gap-1"
                    ><mat-icon class="!text-sm scale-75">bar_chart</mat-icon>
                    {{ recipe.difficulty }}</span
                  >
                </div>
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
                <button mat-button class="!text-[var(--mat-sys-primary)] font-bold">
                  Read Full Recipe
                </button>
                <div class="flex items-center gap-1 text-[var(--mat-sys-on-surface-variant)]">
                  <mat-icon class="scale-75">share</mat-icon>
                </div>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      </section>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly recipeService = inject(RecipeService);
  protected readonly recipes = this.recipeService.recipes;
}
