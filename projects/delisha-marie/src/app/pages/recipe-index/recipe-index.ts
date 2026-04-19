import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  signal,
  inject,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Breadcrumbs, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { RecipeIndexCategoryImages } from './recipe-index-category-images';
import { RecipeIndexMethodImages } from './recipe-index-method-images';
import { RecipeIndexService } from '../../services/recipe-index.service';

@Component({
  selector: 'dm-recipe-index',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    Breadcrumbs,
    RecipeIndexCategoryImages,
    RecipeIndexMethodImages,
  ],
  template: `
    <main class="py-12" aria-labelledby="index-title">
      <!-- Standard Width Container for Header -->
      <div class="into-the-box">
        <!-- Breadcrumb Component -->
        <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8" />

        <!-- High-Impact Text Header -->
        <header class="mb-16 pt-8">
          <h1
            id="index-title"
            class="text-6xl md:text-7xl font-extrabold tracking-tighter text-[var(--mat-sys-on-surface)] mat-headline-medium">
            Recipe <span class="text-[var(--mat-sys-primary)]">Index</span>
          </h1>
          <div class="h-1.5 w-24 bg-[var(--mat-sys-primary)] mt-6 rounded-full"></div>
        </header>
      </div>

      <!-- Categories and Search Component -->
      <dm-recipe-index-category-images [categories]="categories()" />

      <!-- Cooking Methods Component -->
      <dm-recipe-index-method-images [methods]="methods()" />

      <!-- Standard Width Container for Content -->
      <div class="into-the-box">
        <!-- Latest Recipes Segment -->
        <section class="space-y-12" aria-labelledby="latest-title">
          <div
            class="flex items-center justify-between border-b-2 border-[var(--mat-sys-outline-variant)] pb-4">
            <h2 id="latest-title" class="text-3xl font-bold tracking-tight">Latest</h2>
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
          <h2 class="text-3xl font-bold">Never miss a beat!</h2>
          <p class="text-lg max-w-xl mx-auto opacity-90">
            Subscribe to get new updates and cooking tips delivered straight to your inbox.
          </p>
          <button
            mat-flat-button
            class="!bg-[var(--mat-sys-primary)] !text-white !p-6 !rounded-xl !font-bold">
            Join the Studio Newsletter
          </button>
        </footer>
      </div>
    </main>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIndex {
  private readonly service = inject(RecipeIndexService);

  private readonly _data = toSignal(this.service.getData());
  readonly categories = computed(() => this._data()?.featuredCategories || []);
  readonly methods = computed(() => this._data()?.cookingMethods || []);

  readonly breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Home', url: '/' },
    { label: 'Recipe Index' },
  ]);
}
