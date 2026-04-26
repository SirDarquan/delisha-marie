import { Component, input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Recipe } from '../../services/recipe.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'dml-recipe-card',
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterLink,
  ],
  template: `
    <div
      id="recipe-card"
      class="recipe-card bg-[var(--mat-sys-surface-container)] rounded-[3rem] p-6 md:p-10 shadow-2xl border border-[var(--mat-sys-outline-variant)] relative overflow-hidden">
      <!-- Background Decorative Elements -->
      <div
        class="absolute top-0 right-0 w-64 h-64 bg-[var(--mat-sys-primary-container)] opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div
        class="absolute bottom-0 left-0 w-48 h-48 bg-[var(--mat-sys-tertiary-container)] opacity-10 rounded-full -ml-24 -mb-24 blur-3xl"></div>

      <!-- Header: Title & Description (Optional, but good for card context) -->
      <div class="relative z-10 mb-8 text-center xl:text-left">
        <h2 class="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
          {{ recipe().title }}
        </h2>
        <p class="text-lg opacity-70 max-w-2xl font-medium">
          {{ recipe().description }}
        </p>
      </div>

      <!-- Main Grid: Metrics/Nutrition & Image -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 relative z-10">
        <div class="flex flex-col justify-between space-y-8 order-2 xl:order-1">
          <!-- Information Box -->
          <div
            class="flex-1 bg-[var(--mat-sys-surface-container-low)] rounded-[2.5rem] p-6 md:p-8 border border-[var(--mat-sys-outline-variant)] shadow-sm flex flex-col justify-center">
            <div class="grid grid-cols-2 gap-y-12 gap-x-8">
              <!-- Top Row: Servings & Prep -->
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Servings</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition?.servingSize || recipe().yield || recipe().servings
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Prep Time</span
                >
                <span class="text-2xl font-black font-serif italic">{{ recipe().prepTime }}</span>
              </div>

              <!-- Bottom Row: Cook & Total -->
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Cook Time</span
                >
                <span class="text-2xl font-black font-serif italic">{{ recipe().cookTime }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Total Time</span
                >
                <span class="text-2xl font-black font-serif italic text-[var(--mat-sys-primary)]">{{
                  recipe().totalTime
                }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap md:flex-nowrap gap-4 w-full">
            <button
              mat-stroked-button
              class="flex-1 rounded-full h-14 border-2 font-black hover:bg-[var(--mat-sys-primary-container)] hover:text-[var(--mat-sys-on-primary-container)] transition-all">
              <mat-icon class="mr-2">star_border</mat-icon>
              Rate
            </button>
            <button
              mat-stroked-button
              class="flex-1 rounded-full h-14 border-2 font-black hover:bg-[var(--mat-sys-on-surface)] hover:text-[var(--mat-sys-surface)] transition-all">
              <mat-icon class="mr-2">print</mat-icon>
              Print
            </button>
            <button
              mat-stroked-button
              class="flex-1 rounded-full h-14 border-2 font-black hover:bg-[var(--mat-sys-on-surface)] hover:text-[var(--mat-sys-surface)] transition-all">
              <mat-icon class="mr-2">bookmark_border</mat-icon>
              Save
            </button>
          </div>
        </div>

        <!-- Recipe Image -->
        <div
          class="relative aspect-[4/3] xl:aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl group border-8 border-[var(--mat-sys-surface-container-high)] order-1 xl:order-2">
          <img
            [ngSrc]="recipe().image"
            fill
            [alt]="recipe().title"
            class="object-cover transition-transform duration-700 group-hover:scale-110" />
          <div class="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2.5rem]"></div>
        </div>
      </div>

      <div
        class="h-px bg-gradient-to-r from-transparent via-[var(--mat-sys-outline-variant)] to-transparent mb-8"></div>

      <!-- Equipment Section -->
      @if (recipe().equipment && recipe().equipment!.length > 0) {
        <section class="mb-10 relative z-10">
          <div class="flex items-center gap-4 mb-6">
            <h3 class="text-2xl font-black tracking-tight">Equipment</h3>
            <div class="h-px flex-1 bg-[var(--mat-sys-outline-variant)] opacity-30"></div>
          </div>
          <ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            @for (item of recipe().equipment; track item) {
              <li
                class="flex items-center gap-3 p-4 rounded-2xl bg-[var(--mat-sys-surface-container-high)] border border-[var(--mat-sys-outline-variant)] hover:border-[var(--mat-sys-primary)] transition-colors">
                <mat-icon class="text-[var(--mat-sys-primary)] text-sm">construction</mat-icon>
                <span class="font-bold opacity-90">{{ item }}</span>
              </li>
            }
          </ul>
        </section>
      }

      <!-- Ingredients Section -->
      <section class="mb-10 relative z-10">
        <div class="flex items-center gap-4 mb-8">
          <h3 class="text-2xl font-black tracking-tight">Ingredients</h3>
          <div class="h-px flex-1 bg-[var(--mat-sys-outline-variant)] opacity-30"></div>
        </div>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          @for (ingredient of recipe().ingredients; track ingredient) {
            <li class="flex items-start gap-4 group cursor-default">
              <div
                class="mt-1 w-6 h-6 rounded-lg bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] flex items-center justify-center shrink-0 group-hover:bg-[var(--mat-sys-primary)] group-hover:text-[var(--mat-sys-on-primary)] transition-colors">
                <mat-icon class="text-[16px] w-4 h-4">check</mat-icon>
              </div>
              <span
                class="text-lg font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity">
                {{ ingredient }}
              </span>
            </li>
          }
        </ul>
      </section>

      <!-- Instructions Section -->
      <section class="mb-10 relative z-10">
        <div class="flex items-center gap-4 mb-8">
          <h3 class="text-2xl font-black tracking-tight">Instructions</h3>
          <div class="h-px flex-1 bg-[var(--mat-sys-outline-variant)] opacity-30"></div>
        </div>
        <div class="space-y-8">
          @for (step of recipe().instructions; track $index) {
            <div class="flex gap-6 md:gap-10 relative group">
              <div class="flex flex-col items-center shrink-0">
                <div
                  class="w-12 h-12 rounded-2xl bg-[var(--mat-sys-primary)] text-[var(--mat-sys-on-primary)] flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                  {{ $index + 1 }}
                </div>
                @if ($index < recipe().instructions!.length - 1) {
                  <div
                    class="w-0.5 h-full bg-gradient-to-b from-[var(--mat-sys-primary)] to-transparent opacity-20 mt-4 mb-[-40px]"></div>
                }
              </div>
              <div class="pt-2">
                <p
                  class="text-lg md:text-xl font-medium leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                  {{ step }}
                </p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Notes Section -->
      @if (recipe().notes && recipe().notes!.length > 0) {
        <section
          class="mb-10 relative z-10 p-8 rounded-[2rem] bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)] border-l-8 border-[var(--mat-sys-secondary)]">
          <div class="flex items-center gap-3 mb-6">
            <mat-icon class="text-3xl w-8 h-8">lightbulb</mat-icon>
            <h3 class="text-2xl font-black tracking-tight uppercase">Recipe Notes</h3>
          </div>
          <ul class="space-y-4">
            @for (note of recipe().notes; track note) {
              <li class="flex items-start gap-3">
                <div
                  class="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--mat-sys-secondary)] shrink-0"></div>
                <p class="text-lg font-medium opacity-90 leading-relaxed">{{ note }}</p>
              </li>
            }
          </ul>
        </section>
      }

      <!-- Additional Details Section -->
      <section class="mb-10 relative z-10">
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-8 py-6 border-y border-[var(--mat-sys-outline-variant)] border-opacity-30">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase tracking-widest opacity-40">Author</span>
            @if (recipe().author === 'Delisha Marie') {
              <a
                routerLink="/about"
                class="text-xl font-bold hover:text-[var(--mat-sys-primary)] transition-all cursor-pointer decoration-none"
                >{{ recipe().author }}</a
              >
            } @else {
              <span class="text-xl font-bold">{{ recipe().author }}</span>
            }
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase tracking-widest opacity-40">Cuisine</span>
            <span class="text-xl font-bold">{{ recipe().cuisine }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase tracking-widest opacity-40">Course</span>
            <span class="text-xl font-bold">{{ recipe().course }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase tracking-widest opacity-40">Method</span>
            <span class="text-xl font-bold">{{ recipe().method }}</span>
          </div>
        </div>
      </section>

      <!-- Nutritional Information Section -->
      @if (recipe().nutrition) {
        <section class="relative z-10">
          <div
            class="bg-[var(--mat-sys-surface-container-low)] rounded-[2.5rem] p-6 md:p-10 border border-[var(--mat-sys-outline-variant)]">
            <div class="flex items-center gap-4 mb-6">
              <h3 class="text-2xl font-black tracking-tight">Nutritional Information</h3>
              <div class="h-px flex-1 bg-[var(--mat-sys-outline-variant)] opacity-30"></div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Serving Size</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.servingSize
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Calories</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.calories
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Fat</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.fat
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Carbs</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.carbohydrates
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Protein</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.protein
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Fiber</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.fiber
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Sugar</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.sugar
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Sodium</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.sodium
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Cholesterol</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.cholesterol
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-[var(--mat-sys-primary)] group-hover:opacity-100 transition-all"
                  >Saturated Fat</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.saturatedFat
                }}</span>
              </div>
            </div>

            <!-- Disclaimer -->
            <div
              class="mt-12 pt-8 border-t border-[var(--mat-sys-outline-variant)] opacity-40 text-sm font-medium text-center italic">
              * Nutritional information is an estimate provided for informational purposes only.
              Values may vary based on brands and preparation methods.
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .recipe-card {
        font-family: var(--mat-sys-body-large-font);
      }
      /* Custom shadow for the primary numbers */
      .font-serif.italic {
        text-shadow: 2px 2px 0px rgba(var(--mat-sys-primary-rgb), 0.1);
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCard {
  recipe = input.required<Recipe>();
}
