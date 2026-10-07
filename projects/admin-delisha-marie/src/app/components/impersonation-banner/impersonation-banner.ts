import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-impersonation-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
    style: 'display: contents;',
  },
  template: `
    @if (isImpersonating()) {
      <article
        class="sticky top-0 z-[60] bg-slate-950/95 backdrop-blur-md border-b border-amber-500/30 text-amber-300 px-4 md:px-8 py-2 text-sm flex items-center justify-between font-medium shadow-md shadow-amber-950/10"
        aria-label="Active impersonation session">
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-400 text-base">switch_account</span>
          <span>
            Impersonating Member: <strong class="text-white">{{ user()?.email }}</strong>
            @if (tenant()) {
              (Tenant: <span class="text-amber-200 font-semibold">{{ tenant()?.name }}</span
              >)
            }
          </span>
        </div>
        <button
          type="button"
          (click)="onExitImpersonation()"
          class="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm">
          <span class="material-icons text-xs">arrow_back</span>
          Return to Admin
        </button>
      </article>
    }
  `,
})
export class ImpersonationBannerComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = computed(() =>
    typeof this.authService.currentUser === 'function' ? this.authService.currentUser() : null,
  );
  readonly isImpersonating = computed(() =>
    typeof this.authService.isImpersonating === 'function'
      ? this.authService.isImpersonating()
      : false,
  );
  readonly tenant = computed(() =>
    typeof this.authService.tenant === 'function' ? this.authService.tenant() : null,
  );

  async onExitImpersonation(): Promise<void> {
    await this.authService.exitImpersonation();
    await this.router.navigate(['/users']);
  }
}
