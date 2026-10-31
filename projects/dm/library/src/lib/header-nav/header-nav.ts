import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../theme/theme.service';
import { MenuLink } from '../types/menu';

@Component({
  selector: 'dml-header-nav',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
  ],
  host: {
    class: 'flex items-center gap-2',
  },
  template: `
    <!-- Desktop Nav -->
    <nav class="hidden md:flex items-center gap-2 sm:gap-4 md:gap-6">
      @for (link of menuLinks(); track link.label) {
        @if (link.externalUrl) {
          <a
            mat-button
            [href]="link.externalUrl"
            class="!text-base sm:!text-lg !font-medium text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] transition-colors tracking-wide">
            @if (link.icon) {
              <mat-icon class="mr-1.5 text-[var(--mat-sys-primary)]">{{ link.icon }}</mat-icon>
            }
            {{ link.label }}
          </a>
        } @else if (link.children) {
          <button
            mat-button
            [matMenuTriggerFor]="desktopSub"
            class="!text-base sm:!text-lg !font-medium text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] transition-colors tracking-wide">
            @if (link.icon) {
              <mat-icon class="mr-1.5 text-[var(--mat-sys-primary)]">{{ link.icon }}</mat-icon>
            }
            {{ link.label }}
            <mat-icon class="!mr-0">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #desktopSub="matMenu">
            @for (child of link.children; track child.label) {
              <a
                mat-menu-item
                [routerLink]="child.path"
                routerLinkActive="!text-[var(--mat-sys-primary)]">
                @if (child.icon) {
                  <mat-icon class="!mr-2 text-[var(--mat-sys-primary)]">{{ child.icon }}</mat-icon>
                }
                <span>{{ child.label }}</span>
              </a>
            }
          </mat-menu>
        } @else {
          <a
            mat-button
            [routerLink]="link.path"
            routerLinkActive="!text-[var(--mat-sys-primary)]"
            class="!text-base sm:!text-lg !font-medium text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] transition-colors tracking-wide">
            @if (link.icon) {
              <mat-icon class="mr-1.5 text-[var(--mat-sys-primary)]">{{ link.icon }}</mat-icon>
            }
            {{ link.label }}
          </a>
        }
      }

      @if (showThemeToggle()) {
        <div class="flex items-center gap-2 ml-2 sm:ml-4">
          <mat-slide-toggle
            [checked]="themeService.isDark()"
            (change)="themeService.toggle()"
            [hideIcon]="true"
            aria-label="Toggle dark mode">
            <span
              class="flex items-center gap-2 ml-1 text-sm font-bold uppercase tracking-widest text-[var(--mat-sys-on-surface-variant)] transition-all">
              <mat-icon class="!text-[20px] transition-all">{{
                themeService.isDark() ? 'dark_mode' : 'light_mode'
              }}</mat-icon>
            </span>
          </mat-slide-toggle>
        </div>
      }
    </nav>

    <!-- Mobile Nav (Hamburger) -->
    <div class="flex md:hidden items-center gap-2">
      @if (showThemeToggle()) {
        <mat-slide-toggle
          [checked]="themeService.isDark()"
          (change)="themeService.toggle()"
          [hideIcon]="true"
          aria-label="Toggle dark mode">
          <span
            class="flex items-center gap-2 ml-1 text-sm font-bold uppercase tracking-widest text-[var(--mat-sys-on-surface-variant)] transition-all">
            <mat-icon class="!text-[20px] transition-all text-[var(--mat-sys-on-surface-variant)]">
              {{ themeService.isDark() ? 'dark_mode' : 'light_mode' }}
            </mat-icon>
          </span>
        </mat-slide-toggle>
      }

      <button mat-icon-button [matMenuTriggerFor]="mobileMenu" aria-label="Open navigation menu">
        <mat-icon class="text-[var(--mat-sys-on-surface)]">menu</mat-icon>
      </button>

      <mat-menu #mobileMenu="matMenu">
        @for (link of menuLinks(); track link.label) {
          @if (link.externalUrl) {
            <a mat-menu-item [href]="link.externalUrl">
              @if (link.icon) {
                <mat-icon class="!mr-2 text-[var(--mat-sys-primary)]">{{ link.icon }}</mat-icon>
              }
              <span>{{ link.label }}</span>
            </a>
          } @else if (link.children) {
            <button mat-menu-item [matMenuTriggerFor]="mobileSub">
              @if (link.icon) {
                <mat-icon class="!mr-2 text-[var(--mat-sys-primary)]">{{ link.icon }}</mat-icon>
              }
              <span>{{ link.label }}</span>
            </button>
            <mat-menu #mobileSub="matMenu">
              @for (child of link.children; track child.label) {
                <a
                  mat-menu-item
                  [routerLink]="child.path"
                  routerLinkActive="!text-[var(--mat-sys-primary)]">
                  @if (child.icon) {
                    <mat-icon class="!mr-2 text-[var(--mat-sys-primary)]">{{
                      child.icon
                    }}</mat-icon>
                  }
                  <span>{{ child.label }}</span>
                </a>
              }
            </mat-menu>
          } @else {
            <a
              mat-menu-item
              [routerLink]="link.path"
              routerLinkActive="!text-[var(--mat-sys-primary)]">
              @if (link.icon) {
                <mat-icon class="!mr-2">{{ link.icon }}</mat-icon>
              }
              <span>{{ link.label }}</span>
            </a>
          }
        }
      </mat-menu>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderNav {
  readonly menuLinks = input<MenuLink[]>([]);
  readonly showThemeToggle = input<boolean>(true);

  protected readonly themeService = inject(ThemeService);
}
