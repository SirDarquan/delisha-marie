import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'dm-author-bio',
  imports: [CommonModule, NgOptimizedImage, MatButtonModule],
  template: `
    <section
      class="bg-[var(--mat-sys-surface-container)] rounded-[2.5rem] p-6 sm:p-8 text-center shadow-sm border-y sm:border-0 border-[var(--mat-sys-outline-variant)]"
      aria-labelledby="author-title">
      <div class="relative w-40 h-40 mx-auto mb-6">
        <img
          ngSrc="/assets/delisha_marie_profile.png"
          fill
          alt="Delisha Marie"
          class="rounded-full object-cover border-4 border-[var(--mat-sys-outline-variant)] shadow-xl" />
      </div>
      <h3 id="author-title" class="text-2xl font-black mb-3">Hi, I'm Delisha!</h3>
      <p class="text-[var(--mat-sys-on-surface-variant)] font-medium leading-relaxed mb-6">
        I'm a passionate home cook and food stylist dedicated to making elegant, simple recipes that
        anyone can master. Welcome to my kitchen!
      </p>
      <button mat-stroked-button class="rounded-full px-8 font-bold">My Story</button>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorBio {}
