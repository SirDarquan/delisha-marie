import { CommonModule, DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Stars } from '@dm/library';
import { WakeLock } from '../../components/wake-lock/wake-lock';
import { Recipe } from '../../services/recipe.service';

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
    WakeLock,
  ],
  template: `
    <div
      id="recipe-card"
      class="recipe-card bg-[var(--mat-sys-primary-container)] rounded-t-[2rem] shadow-none sm:shadow-2xl border-y sm:border border-[var(--mat-sys-outline-variant)] relative overflow-hidden">
      <!-- Recipe Header Container -->
      <div class="recipe-card-header p-6 md:p-8 rounded-2xl mb-8 overflow-hidden relative z-10">
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
              recipe().yield
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

        <!-- 4. Stars (Rating) & Wake Lock Toggle -->
        <div
          class="recipe-card-rating flex items-center justify-between gap-2 pt-3 border-t border-[var(--mat-sys-outline-variant)]">
          <div class="flex items-center gap-2">
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
          <dml-wake-lock />
        </div>
      </div>
    </div>
    <div
      class="recipe-card bg-[var(--mat-sys-surface-container)] rounded-b-[2rem] p-4 sm:p-6 md:p-10 shadow-none sm:shadow-2xl border-y sm:border border-[var(--mat-sys-outline-variant)] relative overflow-hidden">
      <!-- Action Buttons -->
      <div class="flex flex-wrap md:flex-nowrap gap-4 w-full mb-10 relative z-10">
        <button
          mat-stroked-button
          [routerLink]="['/recipe', recipe().slug, 'print']"
          class="flex-1 rounded-full h-12 border-2 font-black hover:bg-[var(--mat-sys-on-surface)] hover:text-[var(--mat-sys-surface)] transition-all">
          <mat-icon class="mr-2">print</mat-icon>
          Print
        </button>
        <button
          mat-stroked-button
          routerLink="."
          fragment="respond"
          class="flex-1 rounded-full h-12 border-2 font-black hover:bg-[var(--mat-sys-primary-container)] hover:text-[var(--mat-sys-on-primary-container)] transition-all">
          <mat-icon class="mr-2">star_border</mat-icon>
          Rate
        </button>
        <button
          mat-stroked-button
          (click)="openPinterest($event)"
          class="flex-1 rounded-full h-12 border-2 font-black hover:bg-[var(--mat-sys-primary-container)] hover:text-[var(--mat-sys-on-primary-container)] transition-all">
          <mat-icon class="mr-2">
            <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16.75 0.406c-6.413 0-12.75 4.275-12.75 11.194 0 4.4 2.475 6.9 3.975 6.9 0.619 0 0.975-1.725 0.975-2.212 0-0.581-1.481-1.819-1.481-4.238 0-5.025 3.825-8.588 8.775-8.588 4.256 0 7.406 2.419 7.406 6.863 0 3.319-1.331 9.544-5.644 9.544-1.556 0-2.888-1.125-2.888-2.737 0-2.363 1.65-4.65 1.65-7.088 0-4.137-5.869-3.387-5.869 1.613 0 1.050 0.131 2.212 0.6 3.169-0.863 3.713-2.625 9.244-2.625 13.069 0 1.181 0.169 2.344 0.281 3.525 0.212 0.238 0.106 0.213 0.431 0.094 3.15-4.313 3.038-5.156 4.463-10.8 0.769 1.463 2.756 2.25 4.331 2.25 6.637 0 9.619-6.469 9.619-12.3 0-6.206-5.363-10.256-11.25-10.256z" />
            </svg>
          </mat-icon>
          Pinterest
        </button>
        <button
          mat-stroked-button
          disabled
          class="flex-1 rounded-full h-12 border-2 font-black hover:bg-[var(--mat-sys-on-surface)] hover:text-[var(--mat-sys-surface)] transition-all">
          <mat-icon class="mr-2">bookmark_border</mat-icon>
          Save
        </button>
      </div>

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

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCard {
  recipe = input.required<Recipe>();

  private readonly document = inject(DOCUMENT);

  openPinterest(event: Event) {
    event.preventDefault();
    const window = this.document.defaultView;
    if (!window) return;

    const r = this.recipe();
    const url = encodeURIComponent(window.location.href);
    const media = encodeURIComponent(r.image || '');
    const description = encodeURIComponent(r.title || '');

    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`;
    window.open(pinterestUrl, 'pinterestShare', 'width=890,height=600,noreferrer');
  }
}
