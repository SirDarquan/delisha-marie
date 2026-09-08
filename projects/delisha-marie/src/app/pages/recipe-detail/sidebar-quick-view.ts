import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ViewEncapsulation,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Recipe } from '../../services/recipe.service';

@Component({
  selector: 'dm-sidebar-quick-view',
  imports: [CommonModule, MatIconModule, MatButtonModule, NgOptimizedImage],
  template: `
    <div
      class="bg-[var(--mat-sys-surface-container-highest)] rounded-[2.5rem] p-6 shadow-none sm:shadow-xl border-y sm:border border-[var(--mat-sys-outline-variant)] overflow-hidden"
      aria-labelledby="quick-view-title">
      <div class="relative aspect-video rounded-2xl overflow-hidden mb-6">
        <img [ngSrc]="recipe().image" fill [alt]="recipe().title" class="object-cover" />
      </div>

      <h3 id="quick-view-title" class="text-xl font-black mb-6 leading-tight">
        {{ recipe().title }}
      </h3>

      <div class="grid grid-cols-2 gap-4 mb-8">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-[var(--mat-sys-primary-container)] flex items-center justify-center">
            <mat-icon class="text-[var(--mat-sys-primary)] scale-75">schedule</mat-icon>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-black opacity-50 tracking-widest"
              >Prep</span
            >
            <span class="font-bold">{{ recipe().prepTime }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-[var(--mat-sys-primary-container)] flex items-center justify-center">
            <mat-icon class="text-[var(--mat-sys-primary)] scale-75">timer</mat-icon>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-black opacity-50 tracking-widest"
              >Cook</span
            >
            <span class="font-bold">{{ recipe().cookTime }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-[var(--mat-sys-primary-container)] flex items-center justify-center">
            <mat-icon class="text-[var(--mat-sys-primary)] scale-75">restaurant</mat-icon>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-black opacity-50 tracking-widest"
              >Serves</span
            >
            <span class="font-bold">{{ recipe().yield }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-[var(--mat-sys-tertiary-container)] flex items-center justify-center">
            <mat-icon class="text-[var(--mat-sys-tertiary)] scale-75">signal_cellular_alt</mat-icon>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-black opacity-50 tracking-widest"
              >Level</span
            >
            <span class="font-bold">{{ recipe().difficulty }}</span>
          </div>
        </div>
      </div>

      <button
        mat-flat-button
        class="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20"
        (click)="scrollToElement('recipe-card')">
        Jump to Recipe
      </button>
    </div>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarQuickView {
  private readonly document = inject(DOCUMENT);
  recipe = input.required<Recipe>();

  scrollToElement(elementId: string) {
    const window = this.document.defaultView;
    if (!window) return;
    const element = window.document.getElementById(elementId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
