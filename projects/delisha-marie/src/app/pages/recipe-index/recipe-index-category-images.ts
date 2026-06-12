import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { FullCategory } from '../../models/category';

@Component({
  selector: 'dm-recipe-index-category-images',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  template: `
    <!-- Break-out Background with Categories and Search -->
    <section
      class="break-out bg-[var(--mat-sys-surface-container-low)] pt-16 pb-12 mb-20 border-y border-[var(--mat-sys-outline-variant)]">
      <div class="into-the-box">
        <nav aria-label="Recipe categories" class="mb-12">
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            @for (cat of categories(); track cat.name) {
              <a
                [routerLink]="cat.url"
                [attr.aria-label]="'Browse ' + cat.name"
                class="flex flex-col items-center group cursor-pointer transition-all duration-300 no-underline">
                <div
                  class="relative w-full aspect-square overflow-hidden rounded-2xl shadow-sm border border-[var(--mat-sys-outline-variant)] bg-[var(--mat-sys-surface)]">
                  <img
                    [ngSrc]="cat.image"
                    [alt]="cat.name"
                    fill
                    class="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw" />
                  <div
                    class="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>
                </div>
                <div class="py-4 text-center w-full">
                  <span
                    class="font-extrabold text-[13px] uppercase tracking-wider block text-[var(--mat-sys-on-surface)] group-hover:text-[var(--mat-sys-primary)] transition-colors">
                    {{ cat.name }}
                  </span>
                </div>
              </a>
            }
          </div>
        </nav>

        <!-- Premium Search Bar at the bottom of the breakout -->
        <div class="max-w-md mx-auto">
          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            class="w-full search-field !rounded-full overflow-hidden bg-[var(--mat-sys-surface)] shadow-sm">
            <mat-icon matPrefix class="opacity-50">search</mat-icon>
            <input matInput [formControl]="searchControl" placeholder="e.g. Chocolate Cake" />
            <button
              mat-flat-button
              matSuffix
              class="!bg-[var(--mat-sys-primary)] !text-white !h-9 !rounded-full !mr-1 !px-6 hover:brightness-110 transition-all">
              Search
            </button>
          </mat-form-field>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .search-field .mdc-notched-outline {
        display: none;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIndexCategoryImages {
  readonly categories = input.required<FullCategory[]>();
  readonly searchControl = new FormControl('');
}
