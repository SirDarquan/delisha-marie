import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'dm-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  styles: [
    `
      .logo-container {
        display: flex;
        align-items: center;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
        gap: 0.25rem;
      }

      .logo-word {
        display: flex;
        align-items: center;
      }

      .logo-letter-bold {
        font-size: 1.875rem; /* text-3xl for better presence */
        font-weight: 900;
        letter-spacing: -0.05em;
        color: var(--mat-sys-primary);
        line-height: 1;
      }

      .logo-letter-fade {
        font-size: 1.5rem; /* text-2xl */
        font-weight: 300;
        letter-spacing: 0.05em;
        color: var(--mat-sys-primary-inverse);
        opacity: 1;
        max-width: 200px;
        overflow: hidden;
        transition:
          opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
          max-width 0.6s cubic-bezier(0.4, 0, 0.2, 1),
          transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        display: inline-block;
        transform-origin: left;
      }

      @media (max-width: 767px) {
        .logo-letter-fade {
          opacity: 0;
          max-width: 0;
          pointer-events: none;
          transform: scaleX(0);
        }
        .logo-container {
          gap: 0;
        }
      }

      @media (min-width: 768px) {
        .logo-letter-fade {
          opacity: 1;
          max-width: 200px;
          transform: scaleX(1);
        }
      }
    `,
  ],
  host: {
    class: 'sticky top-0 z-50 block',
  },
  template: `
    <mat-toolbar
      class="!bg-[var(--mat-sys-surface)]/80 backdrop-blur-md h-20 px-4 md:px-8 flex justify-between items-center border-b border-[var(--mat-sys-outline-variant)]">
      <a class="flex items-center cursor-pointer logo-container" routerLink="/">
        <div class="logo-word">
          <span class="logo-letter-bold">D</span>
          <span class="logo-letter-fade">elisha</span>
        </div>
        <div class="logo-word">
          <span class="logo-letter-bold">M</span>
          <span class="logo-letter-fade">arie's</span>
        </div>
        <div class="logo-word">
          <span class="logo-letter-bold">K</span>
          <span class="logo-letter-fade">itchen</span>
        </div>
      </a>

      <div class="hidden md:flex items-center gap-6">
        <a
          mat-button
          routerLink="/recipe-index"
          routerLinkActive="!text-[var(--mat-sys-primary)]"
          class="text-lg font-medium">
          Recipes
        </a>
        <a
          mat-button
          routerLink="/about"
          routerLinkActive="!text-[var(--mat-sys-primary)]"
          class="text-lg font-medium">
          About
        </a>
        <a
          mat-button
          routerLink="/contact"
          routerLinkActive="!text-[var(--mat-sys-primary)]"
          class="text-lg font-medium">
          Contact
        </a>

        <div class="flex items-center gap-2 ml-4">
          <mat-slide-toggle
            [checked]="themeService.isDark()"
            (change)="themeService.toggle()"
            [hideIcon]="true">
            <span
              class="flex items-center gap-2 ml-1 text-sm font-bold uppercase tracking-widest text-[var(--mat-sys-on-surface-variant)] transition-all">
              <mat-icon class="!text-[20px] transition-all">{{
                themeService.isDark() ? 'dark_mode' : 'light_mode'
              }}</mat-icon>
            </span>
          </mat-slide-toggle>
        </div>
      </div>

      <div class="flex md:hidden items-center gap-2">
        <mat-slide-toggle
          [checked]="themeService.isDark()"
          (change)="themeService.toggle()"
          [hideIcon]="true">
          <span
            class="flex items-center gap-2 ml-1 text-sm font-bold uppercase tracking-widest text-[var(--mat-sys-on-surface-variant)] transition-all">
            <mat-icon class="!text-[20px] transition-all text-[var(--mat-sys-on-surface-variant)]">
              {{ themeService.isDark() ? 'dark_mode' : 'light_mode' }}
            </mat-icon>
          </span>
        </mat-slide-toggle>
        <button mat-icon-button>
          <mat-icon>menu</mat-icon>
        </button>
      </div>
    </mat-toolbar>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly themeService = inject(ThemeService);
}
