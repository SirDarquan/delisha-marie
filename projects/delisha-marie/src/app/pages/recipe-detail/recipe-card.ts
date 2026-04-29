import { Component, input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Recipe } from '../../services/recipe.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { Stars } from '../../components/stars/stars';

@Component({
  selector: 'dml-recipe-card',
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterLink,
    Stars,
  ],
  template: `
    <div
      id="recipe-card"
      class="recipe-card bg-[var(--mat-sys-surface-container)] rounded-[2rem] p-4 sm:p-6 md:p-10 shadow-none sm:shadow-2xl border-y sm:border border-[var(--mat-sys-outline-variant)] relative overflow-hidden">
      <!-- Recipe Header Container -->
      <div
        class="recipe-card-header bg-[var(--mat-sys-primary-container)] p-6 md:p-8 rounded-2xl mb-8 overflow-hidden relative z-10">
        <!-- 1. Picture (Floated Right) -->
        <div
          class="recipe-card-image-float-right float-right ml-4 sm:ml-6 mb-4 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[180px] md:h-[180px] rounded-lg overflow-hidden shadow-md border-4 border-white">
          <img
            [ngSrc]="recipe().image"
            width="200"
            height="200"
            [alt]="recipe().title"
            class="object-cover w-full h-full" />
        </div>

        <!-- 2. Recipe Title -->
        <h2
          class="recipe-card-title text-2xl md:text-3xl font-bold text-[var(--mat-sys-on-primary-container)] mb-3 leading-tight">
          {{ recipe().title }}
        </h2>

        <!-- 3. Metadata (Yield and Times) -->
        <div class="post-meta recipe-meta flex flex-wrap gap-x-5 gap-y-2 mb-4">
          <!-- Yield Block -->
          <div class="recipe-card-meta-block flex items-center gap-1.5">
            <mat-icon class="text-[var(--mat-sys-primary)] text-base scale-75">restaurant</mat-icon>
            <span class="recipe-card-details-label text-sm italic lowercase">yield: </span>
            <span class="recipe-card-servings text-xs font-bold uppercase tracking-tight">{{
              recipe().yield || recipe().servings || recipe().nutrition?.servingSize || '4 servings'
            }}</span>
          </div>

          <!-- Prep Time Block -->
          <div class="recipe-card-meta-block flex items-center gap-1.5">
            <mat-icon class="text-[var(--mat-sys-primary)] text-base">schedule</mat-icon>
            <span class="recipe-card-details-label text-sm italic lowercase">prep time: </span>
            <span class="recipe-card-time text-xs font-bold uppercase tracking-tight">{{
              recipe().prepTime
            }}</span>
          </div>

          <!-- Cook Time Block -->
          <div class="recipe-card-meta-block flex items-center gap-1.5">
            <mat-icon class="text-[var(--mat-sys-primary)] text-base">timer</mat-icon>
            <span class="recipe-card-details-label text-sm italic lowercase">cook time: </span>
            <span class="recipe-card-time text-xs font-bold uppercase tracking-tight">{{
              recipe().cookTime
            }}</span>
          </div>

          <!-- Total Time Block -->
          <div class="recipe-card-meta-block flex items-center gap-1.5">
            <mat-icon class="text-[var(--mat-sys-primary)] text-base">alarm</mat-icon>
            <span class="recipe-card-details-label text-sm italic lowercase">total time: </span>
            <span
              class="recipe-card-time text-xs font-bold uppercase tracking-tight text-[var(--mat-sys-primary)]"
              >{{ recipe().totalTime }}</span
            >
          </div>
        </div>

        <!-- 4. Stars (Rating) -->
        <div
          class="recipe-card-rating flex items-center gap-2 pt-3 border-t border-[var(--mat-sys-outline-variant)]">
          @if (recipe().rating && recipe().rating! > 0) {
            <dml-stars [rating]="recipe().rating!" />
            <span class="rating-text text-xs font-bold">({{ recipe().ratingCount || 0 }})</span>
          } @else {
            <a
              [routerLink]="recipe().slug"
              fragment="respond"
              class="font-bold text-[var(--mat-sys-primary)] hover:underline decoration-2 underline-offset-4 transition-all"
              >Be the first!</a
            >
          }
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap md:flex-nowrap gap-4 w-full mb-10 relative z-10">
        <button
          mat-stroked-button
          class="flex-1 rounded-full h-12 border-2 font-black hover:bg-[var(--mat-sys-primary-container)] hover:text-[var(--mat-sys-on-primary-container)] transition-all">
          <mat-icon class="mr-2">star_border</mat-icon>
          Rate
        </button>
        <button
          mat-stroked-button
          class="flex-1 rounded-full h-12 border-2 font-black hover:bg-[var(--mat-sys-on-surface)] hover:text-[var(--mat-sys-surface)] transition-all">
          <mat-icon class="mr-2">print</mat-icon>
          Print
        </button>
        <button
          mat-stroked-button
          class="flex-1 rounded-full h-12 border-2 font-black hover:bg-[var(--mat-sys-on-surface)] hover:text-[var(--mat-sys-surface)] transition-all">
          <mat-icon class="mr-2">bookmark_border</mat-icon>
          Save
        </button>
      </div>

      <div class="h-px bg-[var(--mat-sys-outline-variant)] opacity-20 mb-8"></div>

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
                <span class="font-bold">{{ item }}</span>
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
                class="text-lg font-medium leading-tight group-hover:opacity-100 transition-opacity">
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
                    class="w-0.5 h-full bg-gradient-to-b from-[var(--mat-sys-primary)] to-transparent mt-4 mb-[-40px]"></div>
                }
              </div>
              <div class="pt-2">
                <p
                  class="text-lg md:text-xl font-medium leading-relaxed group-hover:opacity-100 transition-opacity">
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
                <p class="text-lg font-medium leading-relaxed">{{ note }}</p>
              </li>
            }
          </ul>
        </section>
      }

      <!-- Additional Details Section -->
      <section class="mb-10 relative z-10">
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-8 py-6 border-y border-[var(--mat-sys-outline-variant)]">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase tracking-widest">Author</span>
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
            <span class="text-[10px] font-black uppercase tracking-widest">Cuisine</span>
            <span class="text-xl font-bold">{{ recipe().cuisine }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase tracking-widest">Course</span>
            <span class="text-xl font-bold">{{ recipe().course }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase tracking-widest">Method</span>
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
              <div class="h-px flex-1 bg-[var(--mat-sys-outline-variant)]"></div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Serving Size</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.servingSize
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Calories</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.calories
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Fat</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.fat
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Carbs</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.carbohydrates
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Protein</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.protein
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Fiber</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.fiber
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Sugar</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.sugar
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Sodium</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.sodium
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Cholesterol</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.cholesterol
                }}</span>
              </div>
              <div class="flex flex-col gap-1 text-center group">
                <span
                  class="text-[10px] font-black uppercase tracking-widest group-hover:text-[var(--mat-sys-primary)] transition-all"
                  >Saturated Fat</span
                >
                <span class="text-2xl font-black font-serif italic">{{
                  recipe().nutrition!.saturatedFat
                }}</span>
              </div>
            </div>

            <!-- Disclaimer -->
            <div
              class="mt-12 pt-8 border-t border-[var(--mat-sys-outline-variant)] text-sm font-medium text-center italic">
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
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCard {
  recipe = input.required<Recipe>();
}
