import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-recipe-index',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16 space-y-4">
        <h1 class="text-6xl font-black tracking-tightest">
          Recipe <span class="text-[var(--mat-sys-primary)] italic">Index</span>
        </h1>
        <p
          class="text-[var(--mat-sys-on-surface-variant)] text-xl font-extralight max-w-2xl mx-auto">
          Explore a curated collection of seasonal recipes, studio secrets, and culinary
          inspirations.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <!-- Coming Soon Placeholder Gallery -->
        @for (item of [1, 2, 3, 4, 5, 6]; track item) {
          <mat-card
            class="!rounded-3xl overflow-hidden border border-[var(--mat-sys-outline-variant)] hover:border-[var(--mat-sys-primary)] transition-all duration-500 group">
            <div
              class="aspect-[4/3] bg-[var(--mat-sys-surface-container-high)] flex items-center justify-center relative overflow-hidden">
              <mat-icon
                class="text-6xl text-[var(--mat-sys-outline)] opacity-20 group-hover:scale-110 transition-transform duration-700"
                >restaurant</mat-icon
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div class="absolute top-4 right-4">
                <mat-chip-set>
                  <mat-chip
                    class="!bg-[var(--mat-sys-primary-container)] !text-[var(--mat-sys-on-primary-container)]"
                    >Coming Soon</mat-chip
                  >
                </mat-chip-set>
              </div>
            </div>
            <mat-card-content class="!p-6 space-y-3">
              <div
                class="h-6 w-3/4 bg-[var(--mat-sys-outline-variant)] rounded-full animate-pulse opacity-50"></div>
              <div
                class="h-4 w-full bg-[var(--mat-sys-outline-variant)] rounded-full animate-pulse opacity-30"></div>
              <div
                class="flex items-center gap-4 pt-4 text-[var(--mat-sys-on-surface-variant)] text-sm">
                <span class="flex items-center gap-1"
                  ><mat-icon class="!text-sm h-4 w-4">schedule</mat-icon> -- min</span
                >
                <span class="flex items-center gap-1"
                  ><mat-icon class="!text-sm h-4 w-4">person</mat-icon> Serves --</span
                >
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <div
        class="mt-20 text-center p-12 border-2 border-dashed border-[var(--mat-sys-outline-variant)] rounded-[3rem]">
        <h2 class="text-2xl font-bold mb-2">More recipes are in the oven...</h2>
        <p class="text-[var(--mat-sys-on-surface-variant)]">
          I'm currently shooting and documenting new culinary adventures. Check back soon!
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .tracking-tightest {
        letter-spacing: -0.05em;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIndex {}
