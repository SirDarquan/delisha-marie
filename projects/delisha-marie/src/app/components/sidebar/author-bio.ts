import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'dm-author-bio',
  imports: [NgOptimizedImage, MatButtonModule],
  template: `
    <section
      [class]="
        layout() === 'vertical'
          ? 'bg-[var(--mat-sys-surface-container)] rounded-[2.5rem] p-6 sm:p-8 text-center shadow-sm border-y sm:border-0 border-[var(--mat-sys-outline-variant)]'
          : 'flex flex-col md:flex-row items-center justify-between text-left py-12 md:py-24'
      "
      aria-labelledby="author-title">
      <div
        [class]="
          layout() === 'vertical'
            ? 'relative w-40 h-40 mx-auto mb-6 shrink-0'
            : 'relative w-full h-[300px] md:w-1/2 md:h-[400px] mb-8 md:mb-0 md:mr-16 shrink-0'
        ">
        <img
          [ngSrc]="picture()"
          fill
          alt="Delisha Marie"
          [class]="
            layout() === 'vertical'
              ? 'rounded-full object-cover border-4 border-[var(--mat-sys-outline-variant)] shadow-xl'
              : 'rounded-2xl object-cover shadow-2xl'
          " />
      </div>
      <div [class]="layout() === 'horizontal' ? 'w-full md:w-1/2' : ''">
        <h3
          id="author-title"
          [class]="
            layout() === 'vertical'
              ? 'text-2xl font-black mb-3'
              : 'text-4xl md:text-5xl font-black mb-6'
          ">
          Hi, I'm Delisha!
        </h3>
        <p
          [class]="
            layout() === 'vertical'
              ? 'text-[var(--mat-sys-on-surface-variant)] font-medium leading-relaxed mb-6'
              : 'text-[var(--mat-sys-on-surface-variant)] text-lg md:text-xl font-medium leading-relaxed mb-8'
          ">
          I'm a passionate home cook and food stylist dedicated to making elegant, simple recipes
          that anyone can master. Welcome to my kitchen!
        </p>
        <button
          mat-stroked-button
          [class]="
            layout() === 'vertical'
              ? 'rounded-full px-8 font-bold'
              : 'rounded-full px-8 py-6 text-lg font-bold'
          ">
          My Story
        </button>
      </div>
    </section>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorBio {
  readonly layout = input<'vertical' | 'horizontal'>('vertical');
  picture = input.required<string>();
}
