import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FullCategory } from '../../models/category';

@Component({
  selector: 'dm-recipe-index-method-images',
  imports: [NgOptimizedImage, RouterLink],
  template: `
    <section class="mb-20" aria-labelledby="methods-title">
      <div class="into-the-box">
        <header class="mb-10 text-left">
          <h2
            id="methods-title"
            class="text-4xl font-extrabold tracking-tight text-[var(--mat-sys-on-surface)]">
            Cooking <span class="text-[var(--mat-sys-primary)]">Methods</span>
          </h2>
          <div class="h-1 w-16 bg-[var(--mat-sys-primary)] mt-4 rounded-full"></div>
        </header>

        <nav aria-label="Cooking methods">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (method of methods(); track method.name) {
              <a
                [routerLink]="method.url"
                [attr.aria-label]="'Recipes using ' + method.name + ' method'"
                class="flex flex-col items-center group cursor-pointer transition-all duration-300 no-underline">
                <div
                  class="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow-md border border-[var(--mat-sys-outline-variant)] bg-[var(--mat-sys-surface)]">
                  <img
                    [ngSrc]="method.image"
                    [alt]="method.name"
                    fill
                    priority
                    class="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div class="py-6 text-center w-full">
                  <span
                    class="font-extrabold text-[15px] uppercase tracking-widest block text-[var(--mat-sys-on-surface)] group-hover:text-[var(--mat-sys-primary)] transition-colors">
                    {{ method.name }}
                  </span>
                </div>
              </a>
            }
          </div>
        </nav>
      </div>
    </section>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIndexMethodImages {
  readonly methods = input.required<FullCategory[]>();
}
