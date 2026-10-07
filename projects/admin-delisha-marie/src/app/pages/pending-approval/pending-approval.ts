import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pending-approval',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[80vh] flex items-center justify-center p-4">
      <div
        class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div
          class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <span class="material-icons text-4xl">hourglass_empty</span>
        </div>

        <h1 class="text-2xl font-black text-white mb-2 tracking-tight">Approval Pending</h1>

        <p class="text-slate-400 text-sm leading-relaxed mb-6">
          Your account has been registered and is currently waiting for administrator review. An
          administrator must approve your account and assign your permissions before you can enter.
        </p>

        @if (statusMessage()) {
          <div
            class="mb-6 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            {{ statusMessage() }}
          </div>
        }

        <div class="flex flex-col gap-3">
          <button
            mat-flat-button
            (click)="checkStatus()"
            [disabled]="isChecking()"
            class="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 transition shadow-lg cursor-pointer">
            @if (isChecking()) {
              Checking Status...
            } @else {
              Check Status
            }
          </button>

          <button
            mat-stroked-button
            (click)="onLogout()"
            class="w-full py-2.5 rounded-xl text-slate-400 border-slate-700 hover:bg-slate-800 transition cursor-pointer">
            Log Out
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PendingApprovalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isChecking = signal<boolean>(false);
  readonly statusMessage = signal<string | null>(null);

  async checkStatus(): Promise<void> {
    this.isChecking.set(true);
    this.statusMessage.set(null);
    try {
      await this.auth.checkSession();
      if (this.auth.userStatus() === 'active') {
        this.router.navigate(['/']);
      } else if (this.auth.userStatus() === 'blocked') {
        this.statusMessage.set('Your account has been blocked by the administrator.');
      } else {
        this.statusMessage.set('Your account is still pending approval. Please check back later.');
      }
    } catch {
      this.statusMessage.set('Unable to check status. Please try again.');
    } finally {
      this.isChecking.set(false);
    }
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
