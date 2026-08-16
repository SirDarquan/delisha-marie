import { Component, input, resource, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dm-recipe-equipment',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (equipmentResource.value()?.length) {
      <div class="mt-8 mb-8">
        <h3 class="text-2xl font-black tracking-tight mb-4">Recommended Products</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (item of equipmentResource.value(); track item.id) {
            <a
              [href]="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group block border border-[var(--mat-sys-outline-variant)] rounded-lg overflow-hidden hover:border-[var(--mat-sys-outline)] transition-colors bg-[var(--mat-sys-surface)]">
              <div
                class="aspect-square bg-[var(--mat-sys-surface-container)] overflow-hidden relative">
                <img
                  [ngSrc]="item.image"
                  [alt]="item.title"
                  fill
                  class="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div class="p-3 text-center">
                <h4
                  class="font-bold text-sm text-[var(--mat-sys-on-surface-variant)] line-clamp-2 group-hover:text-[var(--mat-sys-on-surface)]">
                  {{ item.title }}
                </h4>
              </div>
            </a>
          }
        </div>
        <p class="text-gray-600 text-sm mt-4 text-center">
          Disclaimer: I am a participant in the Amazon Services LLC Associates Program, an affiliate
          advertising program designed to provide a means for me to earn fees by linking to
          Amazon.com and affiliated sites. As an Amazon Associate I earn from qualifying purchases.
        </p>
      </div>
    }
  `,
})
export class RecipeEquipment {
  recipeId = input.required<string | number>();

  private readonly recipeService = inject(RecipeService);

  readonly equipmentResource = resource({
    params: () => ({ id: this.recipeId() }),
    loader: ({ params }) => this.recipeService.getRecipeEquipment(String(params.id)),
  });
}
