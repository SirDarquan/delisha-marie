import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface Category {
  name: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-recipe-index',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <main class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8" aria-labelledby="index-title">
      <!-- Breadcrumb -->
      <nav class="flex mb-8 text-sm font-medium" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-2 text-[var(--mat-sys-on-surface-variant)]">
          <li><a routerLink="/" class="hover:text-[var(--mat-sys-primary)]">Home</a></li>
          <li class="flex items-center space-x-2">
            <mat-icon class="!text-sm">chevron_right</mat-icon>
            <span class="text-[var(--mat-sys-on-surface)]">Recipe Index</span>
          </li>
        </ol>
      </nav>

      <!-- Clean Header -->
      <header class="mb-16">
        <h1 id="index-title" class="text-5xl font-extrabold tracking-tight mat-headline-medium">
          Recipe Index
        </h1>
        <div class="h-1 w-20 bg-[var(--mat-sys-primary)] mt-4"></div>
      </header>

      <!-- Categories Grid -->
      <nav class="mb-24" aria-label="Recipe categories">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          @for (cat of categories(); track cat.name) {
            <button
              [attr.aria-label]="'Browse ' + cat.name"
              class="flex flex-col items-center p-6 rounded-3xl bg-[var(--mat-sys-surface-container-low)] hover:bg-[var(--mat-sys-surface-container-high)] transition-all duration-300 cursor-pointer group border border-[var(--mat-sys-outline-variant)]">
              <div
                class="w-14 h-14 rounded-full bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] flex items-center justify-center mb-3">
                <mat-icon class="text-3xl">{{ cat.icon }}</mat-icon>
              </div>
              <span class="font-bold text-base tracking-tight">{{ cat.name }}</span>
              <span class="text-xs opacity-60 font-medium mt-1">{{ cat.count }} Recipes</span>
            </button>
          }
        </div>
      </nav>

      <!-- Latest Recipes Segment -->
      <section class="space-y-12" aria-labelledby="latest-title">
        <div
          class="flex items-center justify-between border-b-2 border-[var(--mat-sys-outline-variant)] pb-4">
          <h2 id="latest-title" class="text-3xl font-bold tracking-tight">
            Latest <span class="text-[var(--mat-sys-primary)]">Recipes</span>
          </h2>
          <button mat-button class="hover:bg-[var(--mat-sys-primary-container)]">
            Explore All <mat-icon>arrow_right_alt</mat-icon>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
          @for (item of [1, 2, 3, 4, 5, 6]; track item) {
            <mat-card
              role="listitem"
              class="!rounded-2xl overflow-hidden border border-[var(--mat-sys-outline-variant)] hover:shadow-lg transition-all duration-300 shadow-none">
              <div
                class="aspect-video bg-[var(--mat-sys-surface-container-high)] flex items-center justify-center relative">
                <mat-icon class="text-6xl text-[var(--mat-sys-outline)] opacity-20"
                  >restaurant</mat-icon
                >
                <div class="absolute top-4 right-4">
                  <mat-chip-set>
                    <mat-chip class="!bg-[var(--mat-sys-primary)] !text-white !font-bold"
                      >Coming Soon</mat-chip
                    >
                  </mat-chip-set>
                </div>
              </div>
              <mat-card-content class="!p-6 space-y-4">
                <div
                  class="h-6 w-3/4 bg-[var(--mat-sys-surface-container-highest)] rounded animate-pulse"></div>
                <div
                  class="h-4 w-full bg-[var(--mat-sys-surface-container-highest)] rounded animate-pulse opacity-40"></div>
                <div
                  class="flex items-center gap-4 pt-4 text-[var(--mat-sys-on-surface-variant)] text-xs font-semibold">
                  <span class="flex items-center gap-1"
                    ><mat-icon class="!text-base">timer</mat-icon> -- min</span
                  >
                  <span class="flex items-center gap-1"
                    ><mat-icon class="!text-base">person</mat-icon> Serves --</span
                  >
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </section>

      <!-- Newsletter CTA -->
      <footer
        class="mt-24 p-12 bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] rounded-[2rem] text-center space-y-6">
        <h2 class="text-3xl font-bold">Never miss a recipe!</h2>
        <p class="text-lg max-w-xl mx-auto opacity-90">
          Subscribe to get new recipes and cooking tips delivered straight to your inbox.
        </p>
        <button
          mat-flat-button
          class="!bg-[var(--mat-sys-primary)] !text-white !p-6 !rounded-xl !font-bold">
          Join the Studio Newsletter
        </button>
      </footer>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        background: var(--mat-sys-surface);
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIndex {
  readonly categories = signal<Category[]>([
    { name: 'Appetizers', icon: 'tapas', count: 0 },
    { name: 'Breakfast', icon: 'breakfast_dining', count: 0 },
    { name: 'Dinner', icon: 'dinner_dining', count: 0 },
    { name: 'Desserts', icon: 'cake', count: 0 },
    { name: 'Breads', icon: 'bakery_dining', count: 0 },
    { name: 'Drinks', icon: 'local_bar', count: 0 },
  ]);
}
