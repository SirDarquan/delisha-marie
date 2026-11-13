import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Stars } from '@dm/library';
import { Recipe } from '../../services/recipe.service';

export type RecipeCardVariant =
  'individual-links' | 'card-link' | 'ranked-stars' | 'destination-link';

@Component({
  selector: 'dm-recipe-card',
  imports: [NgOptimizedImage, MatCardModule, MatButtonModule, MatIconModule, RouterLink, Stars],
  template: `
    @switch (variant()) {
      @case ('individual-links') {
        <mat-card
          class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border border-[var(--mat-sys-outline-variant)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group flex flex-col h-full">
          <div
            class="relative aspect-[16/10] overflow-hidden bg-[var(--mat-sys-surface-container-highest)]">
            <a
              [routerLink]="['/recipe', recipe().slug]"
              class="block w-full h-full"
              [attr.aria-label]="recipe().title">
              <img
                [ngSrc]="recipe().image"
                fill
                [priority]="priority()"
                [alt]="recipe().title"
                height="auto"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </a>
          </div>

          <mat-card-content class="!p-6 flex-grow flex flex-col">
            @if (shouldShowLocation() && recipe().location && recipe().locationName) {
              <a
                [routerLink]="recipe().location"
                class="inline-block text-xs font-bold tracking-wider uppercase text-[var(--mat-sys-primary)] hover:underline mb-2">
                {{ recipe().locationName }}
              </a>
            }

            <a [routerLink]="['/recipe', recipe().slug]" class="block mb-3">
              <h3
                class="text-xl font-bold font-serif line-clamp-2 text-[var(--mat-sys-on-surface)] group-hover:text-[var(--mat-sys-primary)] transition-colors leading-snug">
                {{ recipe().title }}
              </h3>
            </a>

            <p
              class="text-sm text-[var(--mat-sys-on-surface-variant)] line-clamp-3 leading-relaxed flex-grow">
              {{ recipe().description }}
            </p>
          </mat-card-content>
        </mat-card>
      }

      @case ('card-link') {
        <a [routerLink]="['/recipe', recipe().slug]" class="block no-underline text-inherit h-full">
          <mat-card
            class="!bg-[var(--mat-sys-surface-container)] !rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-[var(--mat-sys-outline-variant)] flex flex-col h-full">
            <div class="aspect-[4/3] overflow-hidden relative">
              <img
                [ngSrc]="recipe().image"
                width="400"
                height="300"
                [priority]="priority()"
                [alt]="recipe().title"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <mat-card-content class="!p-6 space-y-3 flex-grow flex flex-col">
              @if (recipe().locationName) {
                <span
                  class="inline-block text-xs font-bold tracking-wider uppercase text-[var(--mat-sys-primary)]">
                  {{ recipe().locationName }}
                </span>
              }
              <h3
                class="text-xl font-bold leading-tight line-clamp-2 group-hover:text-[var(--mat-sys-primary)] transition-colors">
                {{ recipe().title }}
              </h3>
              <p
                class="text-sm text-[var(--mat-sys-on-surface-variant)] line-clamp-3 font-medium flex-grow">
                {{ recipe().description }}
              </p>
            </mat-card-content>
          </mat-card>
        </a>
      }

      @case ('ranked-stars') {
        <a
          [routerLink]="['/recipe', recipe().slug]"
          class="block no-underline text-inherit relative h-full">
          <mat-card
            class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border-none overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl group h-full flex flex-col relative z-0">
            <div class="relative h-64 overflow-hidden shrink-0">
              <img
                [ngSrc]="recipe().image"
                width="352"
                height="256"
                [priority]="priority()"
                [alt]="recipe().title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              @if (rank() !== null && rank() !== undefined) {
                <div
                  class="absolute top-0 left-4 text-[var(--mat-sys-primary)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] font-black text-[64px] leading-none pointer-events-none select-none z-10">
                  #{{ rank() }}
                </div>
              }
            </div>

            <mat-card-content class="!p-6 flex-grow flex flex-col justify-between relative gap-4">
              <h3
                class="text-2xl font-bold mb-0 line-clamp-2 group-hover:text-[var(--mat-sys-primary)] transition-colors relative z-10">
                {{ recipe().title }}
              </h3>
              <div class="flex items-center gap-1">
                <dml-stars [rating]="recipe().rating" />
                <span class="font-bold text-sm">{{ recipe().rating }} stars</span>
                @if (recipe().reviewCount !== undefined && recipe().reviewCount !== null) {
                  <span class="text-xs text-[var(--mat-sys-on-surface-variant)] ml-1"
                    >({{ recipe().reviewCount }} comments)</span
                  >
                }
              </div>
            </mat-card-content>
          </mat-card>
        </a>
      }

      @case ('destination-link') {
        <a [routerLink]="['/recipe', recipe().slug]" class="block no-underline text-inherit h-full">
          <mat-card
            class="!bg-[var(--mat-sys-surface-container)] !rounded-3xl border-none overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl group h-full flex flex-col">
            <div class="relative h-64 overflow-hidden shrink-0">
              <img
                [ngSrc]="recipe().image"
                width="352"
                height="256"
                [priority]="priority()"
                [alt]="recipe().title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>

            <mat-card-content class="!p-6 flex-grow flex flex-col">
              <h3
                class="text-2xl font-bold mb-3 line-clamp-1 group-hover:text-[var(--mat-sys-primary)] transition-colors">
                {{ recipe().title }}
              </h3>
              <p
                class="text-[var(--mat-sys-on-surface-variant)] line-clamp-2 text-sm leading-relaxed flex-grow">
                {{ recipe().description }}
              </p>
            </mat-card-content>

            <mat-card-actions class="!p-6 !pt-0 flex justify-between items-center">
              <button
                mat-button
                [routerLink]="['/recipe', recipe().slug]"
                class="!text-[var(--mat-sys-primary)] font-bold">
                Read Full Recipe
              </button>
            </mat-card-actions>
          </mat-card>
        </a>
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCard {
  readonly recipe = input.required<Recipe>();
  readonly variant = input<RecipeCardVariant>('card-link');
  readonly rank = input<number | null>(null);
  readonly priority = input<boolean>(false);
  readonly aspectRatio = input<'16/10' | '4/3' | 'h-64'>('16/10');

  readonly shouldShowLocation = computed(() => {
    return (
      this.variant() === 'individual-links' &&
      !!this.recipe().location &&
      !!this.recipe().locationName
    );
  });
}
