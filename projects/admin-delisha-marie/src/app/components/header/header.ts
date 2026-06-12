import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center">
      <div class="flex items-center gap-6">
        <a
          routerLink="/"
          class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent hover:opacity-90 transition">
          Delisha Marie Admin
        </a>
        <nav class="hidden md:flex items-center gap-4">
          <a
            routerLink="/"
            class="text-sm font-semibold text-slate-300 hover:text-purple-400 transition"
            routerLinkActive="text-purple-400 font-bold"
            [routerLinkActiveOptions]="{ exact: true }">
            Dashboard
          </a>
          <a
            routerLink="/recipes"
            class="text-sm font-semibold text-slate-300 hover:text-purple-400 transition"
            routerLinkActive="text-purple-400 font-bold">
            Recipes
          </a>
        </nav>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-slate-400 text-sm font-medium hidden sm:inline">
          Welcome back,
          @if (user()) {
            <span class="text-slate-200 font-semibold">{{ user()?.user_metadata?.username }}</span>
          } @else {
            Admin
          }
          !
        </span>
        <button
          mat-stroked-button
          color="warn"
          (click)="onLogout()"
          class="border-rose-500 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
          Log Out
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.authService.currentUser());

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
