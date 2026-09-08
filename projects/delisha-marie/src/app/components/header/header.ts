import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
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
    MatMenuModule,
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
        @for (link of menuLinks; track link.label) {
          @if (link.children) {
            <button mat-button [matMenuTriggerFor]="desktopSub" class="text-lg font-medium">
              {{ link.label }}
              <mat-icon class="!mr-0">arrow_drop_down</mat-icon>
            </button>
            <mat-menu #desktopSub="matMenu">
              @for (child of link.children; track child.label) {
                <a
                  mat-menu-item
                  [routerLink]="child.path"
                  routerLinkActive="!text-[var(--mat-sys-primary)]">
                  <span>{{ child.label }}</span>
                </a>
              }
            </mat-menu>
          } @else {
            <a
              mat-button
              [routerLink]="link.path"
              routerLinkActive="!text-[var(--mat-sys-primary)]"
              class="text-lg font-medium">
              {{ link.label }}
            </a>
          }
        }

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
        <button mat-icon-button [matMenuTriggerFor]="mobileMenu">
          <mat-icon>menu</mat-icon>
        </button>

        <mat-menu #mobileMenu="matMenu">
          @for (link of menuLinks; track link.label) {
            @if (link.children) {
              <button mat-menu-item [matMenuTriggerFor]="mobileSub">
                <span>{{ link.label }}</span>
              </button>
              <mat-menu #mobileSub="matMenu">
                @for (child of link.children; track child.label) {
                  <a
                    mat-menu-item
                    [routerLink]="child.path"
                    routerLinkActive="!text-[var(--mat-sys-primary)]">
                    <span>{{ child.label }}</span>
                  </a>
                }
              </mat-menu>
            } @else {
              <a
                mat-menu-item
                [routerLink]="link.path"
                routerLinkActive="!text-[var(--mat-sys-primary)]">
                <span>{{ link.label }}</span>
              </a>
            }
          }
        </mat-menu>
      </div>
    </mat-toolbar>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly themeService = inject(ThemeService);

  // Note: Add a `children` array to any item to automatically generate a dropdown!
  protected readonly menuLinks: {
    label: string;
    path?: string;
    children?: { label: string; path: string }[];
  }[] = [
    { path: '/recipe-index', label: 'Recipes' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];
}
