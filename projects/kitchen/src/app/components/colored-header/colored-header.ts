import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'dm-colored-header',
  template: `
    @if (formattedTitle(); as title) {
      <header [class]="headerClasses()">
        <h1 [class]="headingClasses()">
          {{ title.first }} <span class="text-[var(--mat-sys-primary)]">{{ title.last }}</span>
        </h1>
        <div [class]="dividerClasses()"></div>
      </header>
    }
  `,
})
export class ColoredHeaderComponent {
  title = input.required<string>();
  size = input<'large' | 'small' | 'hero'>('large');

  readonly formattedTitle = computed(() => {
    const words = this.title().trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return { first: '', last: '' };
    if (words.length === 1) return { first: words[0], last: '' };

    const first = words[0];
    const last = words.slice(1).join(' ');

    return { first, last };
  });

  readonly headerClasses = computed(() => {
    const s = this.size();
    if (s === 'large') return 'mb-16 pt-8';
    if (s === 'small') return 'mb-12';
    return '';
  });

  readonly headingClasses = computed(() => {
    const s = this.size();
    if (s === 'large') {
      return 'text-6xl md:text-7xl font-extrabold tracking-tighter text-[var(--mat-sys-on-surface)] mat-headline-medium';
    }
    if (s === 'small') {
      return 'text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--mat-sys-on-surface)] mat-headline-small';
    }
    return 'text-3xl md:text-5xl font-bold tracking-tight text-white leading-[0.9] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]';
  });

  readonly dividerClasses = computed(() => {
    const s = this.size();
    if (s === 'large') return 'h-1.5 w-24 bg-[var(--mat-sys-primary)] mt-6 rounded-full';
    if (s === 'small') return 'h-1 w-16 bg-[var(--mat-sys-primary)] mt-4 rounded-full';
    return 'h-1.5 w-16 bg-[var(--mat-sys-primary)] mt-3 rounded-full';
  });
}
