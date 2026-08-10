import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Recipe } from '../../services/recipe.service';

@Component({
  selector: 'dml-recipe-hero',
  imports: [NgOptimizedImage, MatIconModule],
  template: `
    <div class="hero-container mb-20">
      <div
        class="relative aspect-[16/9] rounded-[3rem] overflow-hidden shadow-none sm:shadow-2xl group cursor-default">
        <!-- Image -->
        <img
          [ngSrc]="recipe().image"
          fill
          priority
          [alt]="recipe().title"
          class="object-cover transition-transform duration-[2000ms] group-hover:scale-105" />

        <!-- Title Overlay -->
        <div class="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 md:right-12 z-10">
          <div class="group/title inline-block">
            <h1
              class="text-3xl md:text-5xl font-bold tracking-tight text-white leading-[0.9] transition-colors duration-500 group-hover/title:text-[var(--mat-sys-primary)] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
              {{ recipe().title }}
            </h1>
          </div>
        </div>
      </div>

      <!-- Description below image -->
      <div class="mt-10 text-center max-w-4xl mx-auto px-4">
        <p
          class="text-2xl md:text-3xl text-[var(--mat-sys-on-surface-variant)] italic font-serif leading-relaxed opacity-90">
          "{{ recipe().description }}"
        </p>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeHero {
  recipe = input.required<Recipe>();
}
