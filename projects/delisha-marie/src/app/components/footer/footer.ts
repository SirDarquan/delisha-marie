import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'dm-footer',
  template: `
    <footer
      class="py-12 px-4 border-t border-[var(--mat-sys-outline-variant)] mt-16 bg-[var(--mat-sys-surface-container)]">
      <div
        class="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="flex flex-col items-center md:items-start gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xl font-black tracking-tighter text-[var(--mat-sys-primary)]">
              DELISHA
            </span>
            <span
              class="text-xl font-light tracking-widest text-[var(--mat-sys-tertiary)] uppercase">
              MARIE
            </span>
          </div>
          <p class="text-[var(--mat-sys-on-surface-variant)] text-sm italic">
            Inspired by taste, created with love.
          </p>
        </div>

        <div class="flex gap-8 text-[var(--mat-sys-on-surface-variant)] text-sm font-medium">
          <a href="#" class="hover:text-[var(--mat-sys-primary)] transition-colors">Instagram</a>
          <a href="#" class="hover:text-[var(--mat-sys-primary)] transition-colors">Pinterest</a>
          <a href="#" class="hover:text-[var(--mat-sys-primary)] transition-colors">YouTube</a>
        </div>

        <div class="text-[var(--mat-sys-on-surface-variant)] text-xs">
          © 2026 Delisha Marie. All rights reserved.
        </div>
      </div>
    </footer>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}
