import { CommonModule, DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../services/recipe.service';

@Component({
  selector: 'dm-recipe-print',
  imports: [CommonModule, MatButtonModule, MatIconModule, NgOptimizedImage, RouterLink],
  template: `
    <div
      class="print-page w-full min-h-screen bg-white text-black"
      [ngClass]="'print-size-' + textSize()">
      <!-- Top Settings Bar (Hidden when actually printing) -->
      <div
        class="no-print bg-gray-50 border-b border-gray-200 p-4 sticky top-0 z-50 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div class="flex gap-3">
          <a mat-stroked-button [routerLink]="['/recipe', recipe()?.slug]">
            <mat-icon class="mr-1">arrow_back</mat-icon>
            Go Back
          </a>
          <button
            mat-flat-button
            class="bg-[var(--mat-sys-primary)] text-[var(--mat-sys-on-primary)] font-bold"
            (click)="printRecipe()">
            <mat-icon class="mr-1">print</mat-icon>
            Print
          </button>
        </div>

        <div class="flex flex-wrap gap-6 items-center">
          <!-- Checkboxes -->
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                [checked]="showImage()"
                (change)="showImage.set(!showImage())"
                class="w-4 h-4 rounded text-[var(--mat-sys-primary)] focus:ring-[var(--mat-sys-primary)]" />
              <span class="text-sm font-bold group-hover:text-black transition-colors text-gray-700"
                >Recipe Image</span
              >
            </label>
            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                [checked]="showEquipment()"
                (change)="showEquipment.set(!showEquipment())"
                class="w-4 h-4 rounded text-[var(--mat-sys-primary)] focus:ring-[var(--mat-sys-primary)]" />
              <span class="text-sm font-bold group-hover:text-black transition-colors text-gray-700"
                >Equipment</span
              >
            </label>
            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                [checked]="showNotes()"
                (change)="showNotes.set(!showNotes())"
                class="w-4 h-4 rounded text-[var(--mat-sys-primary)] focus:ring-[var(--mat-sys-primary)]" />
              <span class="text-sm font-bold group-hover:text-black transition-colors text-gray-700"
                >Notes</span
              >
            </label>
          </div>

          <!-- Text Size Toggle -->
          <div class="flex bg-gray-200 rounded-lg p-1 shadow-inner">
            <button
              class="px-4 py-1.5 rounded-md text-sm font-bold transition-all"
              [class.bg-white]="textSize() === 'smaller'"
              [class.shadow]="textSize() === 'smaller'"
              [class.text-gray-500]="textSize() !== 'smaller'"
              (click)="textSize.set('smaller')">
              Smaller
            </button>
            <button
              class="px-4 py-1.5 rounded-md text-sm font-bold transition-all"
              [class.bg-white]="textSize() === 'normal'"
              [class.shadow]="textSize() === 'normal'"
              [class.text-gray-500]="textSize() !== 'normal'"
              (click)="textSize.set('normal')">
              Normal
            </button>
            <button
              class="px-4 py-1.5 rounded-md text-sm font-bold transition-all"
              [class.bg-white]="textSize() === 'larger'"
              [class.shadow]="textSize() === 'larger'"
              [class.text-gray-500]="textSize() !== 'larger'"
              (click)="textSize.set('larger')">
              Larger
            </button>
          </div>
        </div>
      </div>

      <!-- Printable Content -->
      @if (recipe(); as r) {
        <div class="max-w-4xl mx-auto p-8 md:p-12 print:p-0 print:max-w-none">
          <!-- Main Image (Floated Top Right) -->
          @if (showImage() && r.image) {
            <img
              [ngSrc]="r.image"
              [alt]="r.title"
              priority
              width="400"
              height="300"
              class="float-right w-1/3 h-auto object-cover rounded-xl ml-8 mb-8 border border-gray-200" />
          }

          <!-- Recipe Header -->
          <div class="mb-8">
            <h1 class="print-title font-black mb-6 leading-tight">{{ r.title }}</h1>
            <div
              class="flex flex-wrap gap-x-8 gap-y-3 print-meta uppercase tracking-widest font-bold">
              @if (r.yield) {
                <span>Yield: {{ r.yield }}</span>
              }
              @if (r.prepTime) {
                <span>Prep Time: {{ r.prepTime }}</span>
              }
              @if (r.cookTime) {
                <span>Cook Time: {{ r.cookTime }}</span>
              }
              @if (r.totalTime) {
                <span>Total Time: {{ r.totalTime }}</span>
              }
            </div>
          </div>

          <!-- Equipment -->
          @if (showEquipment() && r.equipment && r.equipment.length > 0) {
            <div class="mb-10">
              <h2 class="print-heading font-black uppercase tracking-tight mb-4 pb-2">Equipment</h2>
              <ul class="list-disc pl-6 space-y-2">
                @for (item of r.equipment; track item) {
                  <li class="font-bold print-text">{{ item }}</li>
                }
              </ul>
            </div>
          }

          <!-- Ingredients & Instructions Flowing Linearly -->
          <div class="mb-12">
            <!-- Ingredients -->
            <div>
              <h2 class="print-heading font-black uppercase tracking-tight mb-4 pb-2">
                Ingredients
              </h2>
              <ul class="space-y-4 list-disc pl-6">
                @for (ingredient of r.ingredients; track ingredient) {
                  <li class="flex items-start gap-3">
                    <span class="mt-2 w-2 h-2 rounded-full bg-black shrink-0"></span>
                    <span class="print-text leading-snug">{{ ingredient }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Instructions -->
            <div class="mt-10">
              <h2 class="print-heading font-black uppercase tracking-tight mb-4 pb-2">
                Instructions
              </h2>
              <div class="space-y-6 pl-6">
                @for (step of r.instructions; track $index) {
                  <div class="flex gap-5">
                    <div class="font-black print-heading shrink-0">{{ $index + 1 }}.</div>
                    <div class="print-text leading-relaxed pt-0.5">{{ step }}</div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Notes -->
          @if (showNotes() && r.notes && r.notes.length > 0) {
            <div
              class="mb-10 p-6 bg-gray-50 border-l-4 border-black print:bg-white print:border-l-4 print:border-gray-400">
              <h2 class="print-heading font-black uppercase tracking-tight mb-4">Notes</h2>
              <ul class="space-y-4">
                @for (note of r.notes; track note) {
                  <li class="flex items-start gap-3">
                    <span class="mt-2.5 w-1.5 h-1.5 rounded-full bg-black shrink-0"></span>
                    <span class="print-text leading-relaxed italic">{{ note }}</span>
                  </li>
                }
              </ul>
            </div>
          }

          <!-- Footer -->
          <div class="mt-16 pt-6 text-sm text-center text-gray-500 font-medium">
            <p>Copyright &copy; Delisha Marie</p>
            <p class="mt-2">
              Find this recipe online at:
              <a [href]="windowUrl()" class="underline text-black">{{ windowUrl() }}</a>
            </p>
          </div>
        </div>
      } @else {
        <div class="p-20 text-center max-w-xl mx-auto">
          <mat-icon class="text-6xl text-gray-300 mb-4 h-auto w-auto">print_disabled</mat-icon>
          <h2 class="text-3xl font-black tracking-tighter mb-2">Recipe not found</h2>
          <p class="text-gray-500 mb-8">The recipe you're trying to print cannot be located.</p>
        </div>
      }
    </div>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePrint {
  recipe = input<Recipe | null | undefined>(undefined);

  showImage = signal(true);
  showEquipment = signal(false);
  showNotes = signal(true);
  textSize = signal<'smaller' | 'normal' | 'larger'>('normal');

  private readonly document = inject(DOCUMENT);

  readonly windowUrl = computed(() => {
    // Only attempt to read location if window is available (SSR safe)
    if (this.document.defaultView) {
      // Strip '/print' from the end of the URL to give the actual recipe URL
      return this.document.defaultView.location.href.replace(/\/print\/?$/, '');
    }
    return '';
  });

  printRecipe() {
    this.document.defaultView?.print();
  }
}
