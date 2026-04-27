import { Component, input, output, ChangeDetectionStrategy, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'dml-stars',
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      class="flex items-center gap-1"
      [class.cursor-pointer]="interactive()"
      (mouseleave)="onMouseLeave()"
      role="group"
      aria-label="Star rating">
      @for (star of stars; track $index) {
        <button
          type="button"
          class="star-wrapper relative flex items-center justify-center w-8 h-8 appearance-none bg-transparent border-none p-0"
          [attr.aria-label]="'Rate ' + ($index + 1) + ' stars'"
          [disabled]="!interactive()"
          (mouseenter)="onMouseEnter($index + 1)"
          (click)="handleRating($index + 1)">
          <mat-icon
            class="star-icon text-2xl transition-all duration-300 select-none"
            [class.active]="displayRating() >= $index + 1"
            [class.inactive]="displayRating() < $index + 1"
            [class.hovering]="
              interactive() && hoverRating() !== null && hoverRating()! >= $index + 1
            ">
            {{ getStarIcon($index + 1) }}
          </mat-icon>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .star-wrapper {
        cursor: inherit;
        outline: none;
      }
      .star-wrapper:focus-visible .star-icon {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: 2px;
        border-radius: 4px;
      }
      .star-icon {
        color: var(--mat-sys-outline-variant);
        pointer-events: none;
      }
      .star-icon.active {
        color: var(--mat-sys-primary);
      }
      .star-icon.hovering {
        color: var(--mat-sys-primary);
        filter: drop-shadow(0 0 8px var(--mat-sys-primary));
        transform: scale(1.2);
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stars {
  rating = input<number>(0);
  interactive = input<boolean>(false);
  ratingChange = output<number>();

  protected readonly stars = Array(5).fill(0);
  protected hoverRating = signal<number | null>(null);

  protected displayRating = computed(() => {
    return this.hoverRating() !== null ? this.hoverRating()! : this.rating();
  });

  protected getStarIcon(starIndex: number): string {
    const r = this.displayRating();
    if (r >= starIndex) return 'star';
    if (r >= starIndex - 0.5) return 'star_half';
    return 'star_outline';
  }

  protected onMouseEnter(value: number): void {
    if (this.interactive()) {
      this.hoverRating.set(value);
    }
  }

  protected onMouseLeave(): void {
    if (this.interactive()) {
      this.hoverRating.set(null);
    }
  }

  protected handleRating(value: number): void {
    if (this.interactive()) {
      const newValue = this.rating() === value ? 0 : value;
      this.ratingChange.emit(newValue);
    }
  }
}
