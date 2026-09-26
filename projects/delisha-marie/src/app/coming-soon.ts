import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  isDevMode,
  OnInit,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { provideBaseHref } from './provider/base-href';
import { getHomeUrl } from './utils/navigation';

export const appConfigEx: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideBaseHref('/kitchen'),
  ],
};

// December 2, 2026 10:00:00 AM Panama time (UTC-5) -> 15:00:00 UTC
export const KITCHEN_RELEASE_TIMESTAMP = new Date('2026-12-02T10:00:00-05:00').getTime();

export interface TimeSyncState {
  initialServerTime: number;
  initialPerfTime: number;
  synchronized: boolean;
}

export interface CountdownBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isReleased: boolean;
}

export async function syncServerTime(fetchFn: typeof fetch = fetch): Promise<TimeSyncState> {
  const perfNow = typeof performance !== 'undefined' ? performance.now() : 0;
  try {
    const res = await fetchFn('/config', { method: 'HEAD' });
    const serverDateHeader = res.headers.get('date');
    if (serverDateHeader) {
      const serverTime = new Date(serverDateHeader).getTime();
      if (!Number.isNaN(serverTime)) {
        return {
          initialServerTime: serverTime,
          initialPerfTime: perfNow,
          synchronized: true,
        };
      }
    }
  } catch {
    // Network or server error - gracefully fallback to local time with unverified state
  }

  return {
    initialServerTime: Date.now(),
    initialPerfTime: perfNow,
    synchronized: false,
  };
}

export function getAuthoritativeTime(state: TimeSyncState): number {
  if (typeof performance === 'undefined') {
    return Date.now();
  }
  const elapsed = performance.now() - state.initialPerfTime;
  return state.initialServerTime + elapsed;
}

export function calculateCountdown(
  nowMs: number,
  targetMs = KITCHEN_RELEASE_TIMESTAMP,
): CountdownBreakdown {
  const totalMs = Math.max(0, targetMs - nowMs);
  const isReleased = totalMs <= 0;
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    isReleased,
  };
}

export async function isKitchenReleased(fetchFn: typeof fetch = fetch): Promise<boolean> {
  try {
    const state = await syncServerTime(fetchFn);
    if (!state.synchronized) {
      return false;
    }
    return getAuthoritativeTime(state) >= KITCHEN_RELEASE_TIMESTAMP;
  } catch {
    return false;
  }
}

export async function isLive(
  isDevFn: typeof isDevMode = isDevMode,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  let preview = false;
  if (typeof window !== 'undefined') {
    preview = window.location.hostname.endsWith('vercel.app');
  } else if (typeof process !== 'undefined' && process.env) {
    preview = process.env['VERCEL_ENV'] === 'preview';
  }
  return preview || isDevFn() || (await isKitchenReleased(fetchFn));
}

@Component({
  selector: 'dm-root',
  template: `
    <div
      class="min-h-screen min-h-[100dvh] flex flex-col justify-between bg-black text-white relative overflow-hidden font-sans select-none">
      <!-- Ambient background luxury glow -->
      <div
        class="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] sm:w-[750px] h-[450px] bg-[#ffb952]/10 rounded-full blur-[140px] pointer-events-none"></div>

      <!-- Top Header / Navigation -->
      <header
        class="w-full h-20 px-6 sm:px-12 md:px-20 flex justify-between items-center z-10 border-b border-white/10 backdrop-blur-md bg-black/40">
        <a [href]="homeUrl" class="flex items-center no-underline cursor-pointer group">
          <span
            class="text-2xl font-bold tracking-tight text-[#ffb952] group-hover:scale-105 transition-transform"
            >D</span
          >
          <span class="text-2xl font-light tracking-tight text-white mr-1.5">elisha</span>
          <span
            class="text-2xl font-bold tracking-tight text-[#ffb952] group-hover:scale-105 transition-transform"
            >M</span
          >
          <span class="text-2xl font-light tracking-tight text-white mr-1.5">arie's</span>
          <span
            class="text-2xl font-bold tracking-tight text-[#ffb952] group-hover:scale-105 transition-transform"
            >K</span
          >
          <span class="text-2xl font-light tracking-tight text-white">itchen</span>
        </a>

        <a
          [href]="homeUrl"
          class="px-4 py-2 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-[#ffb952] hover:bg-[#ffb952]/10 transition-all text-sm font-medium no-underline inline-flex items-center gap-1.5">
          <span>&larr;</span>
          <span>Return to Home</span>
        </a>
      </header>

      <!-- Main Countdown Content -->
      <main class="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center z-10">
        <!-- Status Badge -->
        <div
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffb952]/15 border border-[#ffb952]/30 text-[#ffb952] text-xs font-semibold uppercase tracking-widest mb-6 animate-pulse">
          <span class="w-2 h-2 rounded-full bg-[#ffb952]"></span>
          Grand Opening Countdown
        </div>

        <!-- Heading -->
        <h1
          class="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 max-w-3xl leading-tight">
          The Kitchen is <br /><span class="text-[#ffb952]">Coming Soon</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-base sm:text-lg text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
          We are crafting an elevated culinary collection with handcrafted recipes, pairing guides,
          and kitchen stories. Doors unlock December 2, 2026 at 10:00 AM.
        </p>

        @if (!countdown().isReleased) {
          <!-- Screen reader announcement (avoids repetitive per-second vocalization) -->
          <p class="sr-only" aria-live="polite">
            The Kitchen opens on December 2, 2026 at 10:00 AM. {{ countdown().days }} days,
            {{ countdown().hours }} hours, and {{ countdown().minutes }} minutes remaining.
          </p>

          <!-- Countdown Grid (Days, Hours, Minutes, Seconds) with padded numbers -->
          <div
            class="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto w-full mb-10"
            aria-hidden="true">
            <div
              class="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-2xl">
              <span class="text-3xl sm:text-5xl font-black text-[#ffb952] tabular-nums font-mono">
                {{ formattedCountdown().days }}
              </span>
              <span class="text-xs uppercase tracking-widest text-white/60 mt-1 font-semibold"
                >Days</span
              >
            </div>

            <div
              class="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-2xl">
              <span class="text-3xl sm:text-5xl font-black text-[#ffb952] tabular-nums font-mono">
                {{ formattedCountdown().hours }}
              </span>
              <span class="text-xs uppercase tracking-widest text-white/60 mt-1 font-semibold"
                >Hours</span
              >
            </div>

            <div
              class="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-2xl">
              <span class="text-3xl sm:text-5xl font-black text-[#ffb952] tabular-nums font-mono">
                {{ formattedCountdown().minutes }}
              </span>
              <span class="text-xs uppercase tracking-widest text-white/60 mt-1 font-semibold"
                >Minutes</span
              >
            </div>

            <div
              class="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-2xl">
              <span class="text-3xl sm:text-5xl font-black text-[#ffb952] tabular-nums font-mono">
                {{ formattedCountdown().seconds }}
              </span>
              <span class="text-xs uppercase tracking-widest text-white/60 mt-1 font-semibold"
                >Seconds</span
              >
            </div>
          </div>
        } @else {
          <!-- Released State -->
          <div
            class="p-6 rounded-2xl bg-[#ffb952]/15 border border-[#ffb952]/40 text-[#ffb952] max-w-md mx-auto mb-10">
            <h2 class="text-xl font-bold mb-2">The Kitchen Doors Are Open!</h2>
            <p class="text-white/80 text-sm mb-4">
              The wait is over. Experience our full recipe library today.
            </p>
            <button
              type="button"
              (click)="reloadPage()"
              class="px-6 py-2.5 rounded-full bg-[#ffb952] text-black font-semibold text-sm hover:bg-[#ffb952]/90 transition-colors cursor-pointer">
              Enter Kitchen
            </button>
          </div>
        }

        <!-- Secondary action link -->
        <a
          [href]="homeUrl"
          class="text-sm font-medium text-white/60 hover:text-[#ffb952] transition-colors underline underline-offset-4">
          Explore her stories on Delisha Marie Home &rarr;
        </a>
      </main>

      <!-- Footer -->
      <footer
        class="w-full py-6 px-6 text-center text-xs text-white/50 z-10 border-t border-white/10">
        &copy; {{ currentYear }} Delisha Marie. All rights reserved.
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppEx implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly homeUrl = getHomeUrl();
  readonly currentYear = new Date().getFullYear();

  private syncState: TimeSyncState = {
    initialServerTime: Date.now(),
    initialPerfTime: typeof performance !== 'undefined' ? performance.now() : 0,
    synchronized: false,
  };

  readonly authoritativeNow = signal<number>(Date.now());
  readonly countdown = computed<CountdownBreakdown>(() =>
    calculateCountdown(this.authoritativeNow()),
  );

  readonly formattedCountdown = computed(() => {
    const cd = this.countdown();
    return {
      days: String(cd.days),
      hours: String(cd.hours).padStart(2, '0'),
      minutes: String(cd.minutes).padStart(2, '0'),
      seconds: String(cd.seconds).padStart(2, '0'),
      totalMs: cd.totalMs,
      isReleased: cd.isReleased,
    };
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void syncServerTime().then((state) => {
      this.syncState = state;
      this.tick();
    });

    const intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.destroyRef.onDestroy(() => {
      clearInterval(intervalId);
    });
  }

  tick(): void {
    const authoritativeTime = getAuthoritativeTime(this.syncState);
    this.authoritativeNow.set(authoritativeTime);

    if (this.countdown().isReleased) {
      this.reloadPage();
    }
  }

  reloadPage(): void {
    this.document.defaultView?.location.reload();
  }
}
