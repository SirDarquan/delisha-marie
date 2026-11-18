import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
    style: 'display: contents;',
  },
  template: `
    <header
      class="backdrop-blur-md bg-slate-950/90 border-b border-slate-800 px-4 md:px-8 py-3.5 flex flex-col justify-center transition-all"
      [class.top-[41px]]="isImpersonating()">
      <div class="flex justify-between items-center w-full">
        <div class="flex items-center gap-6">
          <a
            routerLink="/"
            (click)="closeMobileMenu()"
            class="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent hover:opacity-90 transition">
            Delisha Marie Admin
          </a>
          <nav class="hidden md:flex items-center gap-1.5">
            <a
              routerLink="/"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
              routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold"
              [routerLinkActiveOptions]="{ exact: true }">
              Dashboard
            </a>

            @if (isAdmin() && !isImpersonating()) {
              <a
                routerLink="/users"
                class="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
                routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
                Users & Tenants
              </a>
            } @else {
              <a
                routerLink="/recipes"
                class="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
                routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
                Recipes
              </a>
              <a
                routerLink="/contacts"
                class="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
                routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
                Contacts
              </a>
              <a
                routerLink="/pages"
                class="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
                routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
                Other Pages
              </a>
            }
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-slate-400 text-sm font-medium hidden sm:inline">
            Welcome back,
            @if (effectiveGreetingUser()) {
              <span class="text-slate-200 font-semibold">{{
                effectiveGreetingUser()?.user_metadata?.username || effectiveGreetingUser()?.email
              }}</span>
            } @else {
              Admin
            }
            !
          </span>
          <button
            mat-stroked-button
            color="warn"
            (click)="onLogout()"
            class="hidden sm:inline-flex border-rose-500 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
            Log Out
          </button>
          <button
            mat-icon-button
            type="button"
            (click)="toggleMobileMenu()"
            aria-label="Toggle navigation menu"
            class="md:hidden text-slate-300 hover:text-white cursor-pointer">
            <mat-icon>{{ isMobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>
      </div>

      @if (isMobileMenuOpen()) {
        <nav
          class="md:hidden mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1 w-full"
          aria-label="Mobile Navigation">
          <a
            routerLink="/"
            (click)="closeMobileMenu()"
            class="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
            routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold"
            [routerLinkActiveOptions]="{ exact: true }">
            Dashboard
          </a>

          @if (isAdmin() && !isImpersonating()) {
            <a
              routerLink="/users"
              (click)="closeMobileMenu()"
              class="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
              routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
              Users & Tenants
            </a>
          } @else {
            <a
              routerLink="/recipes"
              (click)="closeMobileMenu()"
              class="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
              routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
              Recipes
            </a>
            <a
              routerLink="/contacts"
              (click)="closeMobileMenu()"
              class="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
              routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
              Contacts
            </a>
            <a
              routerLink="/pages"
              (click)="closeMobileMenu()"
              class="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-900 transition"
              routerLinkActive="!text-purple-400 !bg-purple-950/40 font-bold">
              Other Pages
            </a>
          }

          <div
            class="pt-3 mt-1 border-t border-slate-800/60 flex items-center justify-between sm:hidden px-3 py-1">
            <span class="text-xs text-slate-400 truncate max-w-[200px]">
              {{
                effectiveGreetingUser()?.user_metadata?.username ||
                  effectiveGreetingUser()?.email ||
                  'Admin'
              }}
            </span>
            <button
              mat-stroked-button
              color="warn"
              (click)="onLogout()"
              class="border-rose-500 text-rose-400 hover:bg-rose-500/10 !text-xs !py-1 !px-3">
              Log Out
            </button>
          </div>
        </nav>
      }
    </header>
  `,
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isMobileMenuOpen = signal<boolean>(false);

  readonly user = computed(() =>
    typeof this.authService.currentUser === 'function' ? this.authService.currentUser() : null,
  );
  readonly adminUser = computed(() =>
    typeof this.authService.adminUser === 'function' ? this.authService.adminUser() : null,
  );
  readonly effectiveGreetingUser = computed(() => this.adminUser() || this.user());
  readonly isAdmin = computed(() =>
    typeof this.authService.isAdmin === 'function' ? this.authService.isAdmin() : false,
  );
  readonly isImpersonating = computed(() =>
    typeof this.authService.isImpersonating === 'function'
      ? this.authService.isImpersonating()
      : false,
  );

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
