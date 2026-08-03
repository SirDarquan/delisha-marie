import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'dml-wake-lock',
  imports: [MatSlideToggleModule, MatIconModule],
  template: `
    @if (isSupported()) {
      <div class="inline-flex items-center gap-2">
        <mat-slide-toggle
          [checked]="isActive()"
          (change)="toggle($event.checked)"
          [hideIcon]="true"
          aria-label="Keep screen awake">
          <span
            class="flex items-center gap-1.5 ml-1 text-xs font-bold uppercase tracking-wider text-[var(--mat-sys-on-surface-variant)] select-none">
            <mat-icon
              class="!text-[18px] !w-[18px] !h-[18px] transition-colors"
              [class.text-[var(--mat-sys-primary)]]="isActive()">
              {{ isActive() ? 'screen_lock_portrait' : 'screen_rotation' }}
            </mat-icon>
            <span>Keep Screen On</span>
          </span>
        </mat-slide-toggle>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WakeLock implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  protected readonly isSupported = signal<boolean>(false);
  protected readonly isActive = signal<boolean>(false);

  private wakeLockSentinel: WakeLockSentinel | null = null;
  private userWantsLock = false;

  private readonly handleVisibilityChange = async () => {
    if (this.userWantsLock && this.document.visibilityState === 'visible') {
      await this.requestWakeLock();
    }
  };

  ngOnInit(): void {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !!navigator.wakeLock) {
      this.isSupported.set(true);
    }

    if (typeof document !== 'undefined') {
      this.document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      this.document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.releaseWakeLock();
  }

  protected async toggle(enable: boolean): Promise<void> {
    this.userWantsLock = enable;
    if (enable) {
      await this.requestWakeLock();
    } else {
      await this.releaseWakeLock();
    }
  }

  private async requestWakeLock(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && navigator.wakeLock) {
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.isActive.set(true);

        this.wakeLockSentinel.addEventListener('release', () => {
          this.isActive.set(false);
          this.wakeLockSentinel = null;
        });
      }
    } catch {
      this.isActive.set(false);
      this.wakeLockSentinel = null;
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch {
        // Ignored
      } finally {
        this.wakeLockSentinel = null;
        this.isActive.set(false);
      }
    }
  }
}
