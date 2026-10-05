import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Sidebar } from '../../components/sidebar/sidebar';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';

@Component({
  selector: 'dm-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule, Sidebar, ColoredHeaderComponent],
  template: `
    <main class="into-the-box py-12">
      <div class="flex flex-col lg:flex-row gap-12 items-start">
        <!-- Main Content Area -->
        <div class="lg:w-2/3 w-full flex flex-col items-center text-center">
          <div
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--mat-sys-error-container)] text-[var(--mat-sys-on-error-container)] self-start mb-2">
            Error 404 • Missing {{ resolvedLabel() }}
          </div>
          <dm-colored-header [title]="resolvedTitle()" class="w-full text-left" />

          <!-- Interactive Pot Illustration -->
          <div
            class="pot-illustration-card relative w-full max-w-lg mx-auto my-6 p-6 sm:p-8 rounded-3xl bg-[var(--mat-sys-surface-container-low)] border border-[var(--mat-sys-outline-variant)] shadow-sm overflow-hidden flex flex-col items-center cursor-pointer group"
            (click)="addSeasoning()"
            (keydown.enter)="addSeasoning()"
            (keydown.space)="addSeasoning()"
            tabindex="0"
            role="button"
            aria-label="Interactive cooking pot. Click to throw in seasoning."
            title="Click the pot to throw in seasoning!">
            <!-- SVG Drawing of Simmering Pot, Stirring Spoon & Seasoning -->
            <svg
              viewBox="0 0 400 320"
              class="cooking-pot-svg w-full max-w-[340px] sm:max-w-[380px] h-auto overflow-visible select-none"
              aria-hidden="true">
              <defs>
                <!-- Pot Body Gradient -->
                <linearGradient id="potBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#1c1917" />
                  <stop offset="25%" stop-color="#38332e" />
                  <stop offset="50%" stop-color="#44403c" />
                  <stop offset="75%" stop-color="#2d2824" />
                  <stop offset="100%" stop-color="#1c1917" />
                </linearGradient>

                <!-- Pot Rim Metallic Gradient -->
                <linearGradient id="potRimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#292524" />
                  <stop offset="30%" stop-color="#57534e" />
                  <stop offset="70%" stop-color="#78716c" />
                  <stop offset="100%" stop-color="#292524" />
                </linearGradient>

                <!-- Simmering Stew Radial Gradient -->
                <radialGradient id="stewGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#f59e0b" />
                  <stop offset="35%" stop-color="#d97706" />
                  <stop offset="70%" stop-color="#b45309" />
                  <stop offset="100%" stop-color="#78350f" />
                </radialGradient>

                <!-- Wooden Spoon Gradient -->
                <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#d97706" />
                  <stop offset="40%" stop-color="#b45309" />
                  <stop offset="80%" stop-color="#92400e" />
                  <stop offset="100%" stop-color="#78350f" />
                </linearGradient>

                <!-- Steam Mask / Gradient -->
                <linearGradient id="steamGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stop-color="rgba(255, 255, 255, 0)" />
                  <stop offset="40%" stop-color="rgba(255, 255, 255, 0.45)" />
                  <stop offset="70%" stop-color="rgba(255, 255, 255, 0.25)" />
                  <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
                </linearGradient>
              </defs>

              <!-- Floor Drop Shadow -->
              <ellipse
                cx="200"
                cy="280"
                rx="105"
                ry="14"
                fill="rgba(0, 0, 0, 0.35)"
                class="pot-shadow" />

              <!-- Steam Wisps Rising From Stew -->
              <g
                class="steam-layer"
                fill="none"
                stroke="url(#steamGradient)"
                stroke-width="3"
                stroke-linecap="round">
                <path
                  d="M 160 115 C 145 92, 172 75, 156 50 C 146 32, 162 18, 154 5"
                  class="steam-wisp steam-wisp-1" />
                <path
                  d="M 200 112 C 218 88, 192 68, 212 44 C 224 28, 206 14, 216 2"
                  class="steam-wisp steam-wisp-2" />
                <path
                  d="M 240 115 C 226 92, 252 75, 236 50 C 226 32, 242 18, 234 5"
                  class="steam-wisp steam-wisp-3" />
              </g>

              <!-- Dutch Oven Pot Body -->
              <path
                d="M 100 135 C 100 238, 128 274, 200 274 C 272 274, 300 238, 300 135 Z"
                fill="url(#potBodyGradient)"
                stroke="#292524"
                stroke-width="2.5" />

              <!-- Curved Handles on Sides -->
              <path
                d="M 100 148 C 66 148, 66 186, 100 186"
                fill="none"
                stroke="#c28317"
                stroke-width="7"
                stroke-linecap="round" />
              <path
                d="M 300 148 C 334 148, 334 186, 300 186"
                fill="none"
                stroke="#c28317"
                stroke-width="7"
                stroke-linecap="round" />

              <!-- Subtle Metallic Reflection on Pot Left Flank -->
              <path
                d="M 120 156 C 114 212, 134 250, 174 262"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                stroke-width="5"
                stroke-linecap="round" />

              <!-- Outer Pot Rim -->
              <ellipse
                cx="200"
                cy="135"
                rx="100"
                ry="24"
                fill="url(#potRimGradient)"
                stroke="#57534e"
                stroke-width="2" />
              <ellipse cx="200" cy="135" rx="96" ry="21" fill="#1c1917" />

              <!-- Simmering Stew Surface -->
              <ellipse
                cx="200"
                cy="136"
                rx="92"
                ry="19"
                fill="url(#stewGradient)"
                class="stew-surface" />

              <!-- Simmering Broth Swirls -->
              <ellipse
                cx="196"
                cy="136"
                rx="68"
                ry="13"
                fill="none"
                stroke="rgba(254, 240, 138, 0.3)"
                stroke-width="2"
                class="stew-wave" />
              <ellipse
                cx="204"
                cy="137"
                rx="42"
                ry="8"
                fill="none"
                stroke="rgba(254, 240, 138, 0.22)"
                stroke-width="1.5"
                class="stew-wave-inner" />

              <!-- Gentle Simmer Bubbles -->
              <g class="simmer-bubbles" fill="#fef08a">
                <circle cx="155" cy="137" r="3" class="bubble bubble-1" />
                <circle cx="238" cy="133" r="3.5" class="bubble bubble-2" />
                <circle cx="185" cy="142" r="2.5" class="bubble bubble-3" />
                <circle cx="218" cy="140" r="3" class="bubble bubble-4" />
              </g>

              <!-- Seasoning Impact Ripples -->
              <g class="seasoning-impact-ripples" fill="none" stroke="#fef08a" stroke-width="1.5">
                <circle cx="195" cy="136" r="2" class="splash-ripple splash-ripple-1" />
                <circle cx="210" cy="138" r="2" class="splash-ripple splash-ripple-2" />
              </g>

              <!-- Wooden Spoon (Slow Stirring Motion) -->
              <g class="spoon-group">
                <!-- Spoon Handle -->
                <path
                  d="M 288 32 L 208 126 C 204 130, 198 135, 186 137"
                  fill="none"
                  stroke="url(#woodGradient)"
                  stroke-width="8"
                  stroke-linecap="round" />
                <!-- Spoon Bowl (Dipped in stew) -->
                <ellipse
                  cx="186"
                  cy="137"
                  rx="14"
                  ry="8"
                  fill="url(#woodGradient)"
                  stroke="#78350f"
                  stroke-width="1.2" />
                <!-- Stew Broth Clinging to Spoon Bowl -->
                <ellipse cx="186" cy="138" rx="12" ry="6" fill="#d97706" opacity="0.8" />
                <path
                  d="M 180 137 Q 186 142, 192 137"
                  fill="none"
                  stroke="#fef08a"
                  stroke-width="1"
                  opacity="0.6" />
              </g>

              <!-- Seasoning Being Thrown In Periodically -->
              <g class="seasoning-cascade">
                <!-- Hand / Pinch of Seasoning silhouette appearing from top -->
                <g class="seasoning-hand">
                  <!-- Fingertips holding a pinch of herbs and sea salt -->
                  <path
                    d="M 215 15 C 210 25, 202 38, 198 46 C 196 50, 198 55, 204 53 C 208 51, 216 42, 222 35 C 228 42, 232 48, 235 48 C 238 48, 238 42, 234 35 C 230 25, 226 15, 224 10 Z"
                    fill="#e29e34"
                    opacity="0.85" />
                  <ellipse cx="206" cy="50" rx="3" ry="2" fill="#fff" opacity="0.9" />
                </g>

                <!-- Falling Spice Particles (Cascading every once in a while) -->
                <!-- Green herb flecks -->
                <rect
                  x="198"
                  y="52"
                  width="3"
                  height="2"
                  rx="0.5"
                  fill="#22c55e"
                  class="spice-particle p1" />
                <rect
                  x="206"
                  y="50"
                  width="2.5"
                  height="2.5"
                  rx="0.5"
                  fill="#16a34a"
                  class="spice-particle p2" />
                <rect
                  x="214"
                  y="53"
                  width="3"
                  height="1.8"
                  rx="0.5"
                  fill="#4ade80"
                  class="spice-particle p3" />
                <!-- Sea salt crystals -->
                <circle cx="202" cy="54" r="1.5" fill="#ffffff" class="spice-particle p4" />
                <circle cx="218" cy="51" r="1.6" fill="#ffffff" class="spice-particle p5" />
                <circle cx="210" cy="56" r="1.4" fill="#fef08a" class="spice-particle p6" />
                <!-- Paprika & crushed pepper flakes -->
                <polygon points="196,52 199,55 195,56" fill="#ef4444" class="spice-particle p7" />
                <polygon points="212,52 215,55 213,56" fill="#f97316" class="spice-particle p8" />
                <circle cx="205" cy="58" r="1.2" fill="#1c1917" class="spice-particle p9" />
              </g>

              <!-- Extra User-Clicked Seasoning Bursts -->
              @for (burst of bursts(); track burst) {
                <g class="extra-seasoning-cascade">
                  <circle cx="185" cy="65" r="2" fill="#ffffff" class="extra-particle ep1" />
                  <rect
                    x="192"
                    y="60"
                    width="3"
                    height="2"
                    rx="0.5"
                    fill="#22c55e"
                    class="extra-particle ep2" />
                  <polygon
                    points="200,62 203,66 199,66"
                    fill="#ef4444"
                    class="extra-particle ep3" />
                  <circle cx="208" cy="64" r="2" fill="#fef08a" class="extra-particle ep4" />
                  <rect
                    x="215"
                    y="61"
                    width="3"
                    height="2"
                    rx="0.5"
                    fill="#4ade80"
                    class="extra-particle ep5" />
                  <circle cx="222" cy="66" r="1.6" fill="#ffffff" class="extra-particle ep6" />
                </g>
              }
            </svg>

            <!-- Dynamic Seasoning Status Message -->
            <p
              class="seasoning-status-label text-sm font-medium mt-4 text-[var(--mat-sys-on-surface-variant)] transition-all">
              {{ seasoningMessage() }}
            </p>
          </div>

          <!-- 404 Description & Navigation -->
          <div class="space-y-4 max-w-xl mx-auto mt-2">
            <h2
              class="text-3xl sm:text-4xl font-black font-serif text-[var(--mat-sys-on-surface)] leading-tight">
              Something is simmering, but this {{ resolvedNoun() }} isn't on the menu!
            </h2>

            <p
              class="text-base sm:text-lg text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
              The {{ resolvedNoun() }} you are looking for may have been whisked away, renamed, or
              is still slowly simmering on the back burner. Let's get you back to something
              delicious.
            </p>

            <!-- Navigation Buttons -->
            <div class="pt-6 flex flex-wrap gap-4 justify-center items-center">
              <a
                mat-flat-button
                routerLink="/"
                class="h-12 px-8 rounded-full font-bold flex items-center gap-2 bg-[var(--mat-sys-primary)] text-[var(--mat-sys-on-primary)] shadow-sm hover:opacity-95 transition-all">
                <mat-icon>home</mat-icon>
                <span>Back to Kitchen</span>
              </a>

              <a
                mat-stroked-button
                routerLink="/recipe-index"
                class="h-12 px-6 rounded-full font-bold flex items-center gap-2 border border-[var(--mat-sys-outline)] text-[var(--mat-sys-on-surface)] hover:bg-[var(--mat-sys-surface-container-highest)] transition-all">
                <mat-icon>menu_book</mat-icon>
                <span>Browse Recipe Index</span>
              </a>

              <a
                mat-button
                routerLink="/search"
                class="h-12 px-6 rounded-full font-semibold flex items-center gap-2 text-[var(--mat-sys-primary)] hover:bg-[var(--mat-sys-surface-container)] transition-all">
                <mat-icon>search</mat-icon>
                <span>Search Recipes</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="lg:w-1/3 w-full">
          <dml-sidebar />
        </aside>
      </div>
    </main>
  `,
  styles: `
    /* === Slow Stirring Wooden Spoon Animation === */
    .spoon-group {
      transform-origin: 200px 136px;
      animation: slow-stir 5.2s ease-in-out infinite;
    }

    @keyframes slow-stir {
      0% {
        transform: translate(0px, 0px) rotate(0deg);
      }
      25% {
        transform: translate(14px, 4px) rotate(5deg);
      }
      50% {
        transform: translate(24px, 0px) rotate(0deg);
      }
      75% {
        transform: translate(10px, -4px) rotate(-6deg);
      }
      100% {
        transform: translate(0px, 0px) rotate(0deg);
      }
    }

    /* === Simmering Stew Surface Wave & Bubbles === */
    .stew-wave {
      transform-origin: 200px 136px;
      animation: stew-swirl 5.2s ease-in-out infinite;
    }

    .stew-wave-inner {
      transform-origin: 200px 137px;
      animation: stew-swirl 5.2s ease-in-out infinite reverse;
    }

    @keyframes stew-swirl {
      0%,
      100% {
        transform: scale(1) rotate(0deg);
        opacity: 0.3;
      }
      50% {
        transform: scale(1.04) rotate(4deg);
        opacity: 0.45;
      }
    }

    .bubble {
      animation: bubble-pop 2.4s ease-in-out infinite;
    }
    .bubble-1 {
      animation-delay: 0.2s;
    }
    .bubble-2 {
      animation-delay: 1.1s;
    }
    .bubble-3 {
      animation-delay: 1.8s;
    }
    .bubble-4 {
      animation-delay: 0.6s;
    }

    @keyframes bubble-pop {
      0%,
      100% {
        transform: translateY(0) scale(0.6);
        opacity: 0.2;
      }
      50% {
        transform: translateY(-2px) scale(1.2);
        opacity: 0.9;
      }
      70% {
        transform: translateY(-3px) scale(0.2);
        opacity: 0;
      }
    }

    /* === Rising Steam Wisps === */
    .steam-wisp {
      stroke-dasharray: 60;
      animation: steam-rise 4.2s ease-out infinite;
    }
    .steam-wisp-1 {
      animation-delay: 0s;
    }
    .steam-wisp-2 {
      animation-delay: 1.4s;
    }
    .steam-wisp-3 {
      animation-delay: 2.8s;
    }

    @keyframes steam-rise {
      0% {
        stroke-dashoffset: 60;
        opacity: 0;
        transform: translateY(0) scaleX(1);
      }
      25% {
        opacity: 0.7;
      }
      70% {
        opacity: 0.4;
      }
      100% {
        stroke-dashoffset: -60;
        opacity: 0;
        transform: translateY(-22px) scaleX(1.15);
      }
    }

    /* === Periodic Seasoning Throw Sequence (Every 6.5s) === */
    .seasoning-cascade {
      animation: seasoning-cycle 6.5s ease-in-out infinite;
    }

    /* Pinch hand appears, flicks seasoning, then gently recedes */
    .seasoning-hand {
      transform-origin: 215px 30px;
      animation: hand-pinch 6.5s ease-in-out infinite;
    }

    @keyframes hand-pinch {
      0%,
      82%,
      100% {
        opacity: 0;
        transform: translateY(-25px) scale(0.85);
      }
      6% {
        opacity: 0.95;
        transform: translateY(0px) scale(1);
      }
      18% {
        opacity: 0.95;
        transform: translateY(2px) scale(0.95);
      }
      28% {
        opacity: 0;
        transform: translateY(-15px) scale(0.9);
      }
    }

    /* Falling Seasoning Particles */
    .spice-particle {
      animation: spice-fall 6.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    .p1 {
      animation-delay: 0.8s;
    }
    .p2 {
      animation-delay: 0.9s;
    }
    .p3 {
      animation-delay: 1.05s;
    }
    .p4 {
      animation-delay: 0.85s;
    }
    .p5 {
      animation-delay: 1.1s;
    }
    .p6 {
      animation-delay: 0.95s;
    }
    .p7 {
      animation-delay: 1.15s;
    }
    .p8 {
      animation-delay: 1s;
    }
    .p9 {
      animation-delay: 1.2s;
    }

    @keyframes spice-fall {
      0%,
      12%,
      100% {
        opacity: 0;
        transform: translate(0, 0) scale(0.5);
      }
      15% {
        opacity: 1;
        transform: translate(0, 4px) scale(1.1);
      }
      26% {
        opacity: 1;
        transform: translate(var(--drift-x, 2px), 78px) scale(0.9);
      }
      28% {
        opacity: 0;
        transform: translate(var(--drift-x, 3px), 82px) scale(0.3);
      }
    }

    .p1 {
      --drift-x: -16px;
    }
    .p2 {
      --drift-x: -6px;
    }
    .p3 {
      --drift-x: 10px;
    }
    .p4 {
      --drift-x: -12px;
    }
    .p5 {
      --drift-x: 14px;
    }
    .p6 {
      --drift-x: -2px;
    }
    .p7 {
      --drift-x: -18px;
    }
    .p8 {
      --drift-x: 6px;
    }
    .p9 {
      --drift-x: 2px;
    }

    /* Seasoning Impact Ripples on Stew */
    .splash-ripple {
      animation: ripple-spread 6.5s ease-out infinite;
    }
    .splash-ripple-1 {
      animation-delay: 1.8s;
    }
    .splash-ripple-2 {
      animation-delay: 2s;
    }

    @keyframes ripple-spread {
      0%,
      26%,
      100% {
        opacity: 0;
        transform: scale(0.2);
      }
      28% {
        opacity: 0.75;
      }
      38% {
        opacity: 0;
        transform: scale(2.6);
      }
    }

    /* Extra On-Click Seasoning Particle Burst */
    .extra-particle {
      animation: extra-fall 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    .ep1 {
      --edrift: -20px;
      animation-delay: 0.05s;
    }
    .ep2 {
      --edrift: -8px;
      animation-delay: 0.1s;
    }
    .ep3 {
      --edrift: 4px;
      animation-delay: 0.15s;
    }
    .ep4 {
      --edrift: 16px;
      animation-delay: 0.08s;
    }
    .ep5 {
      --edrift: 22px;
      animation-delay: 0.2s;
    }
    .ep6 {
      --edrift: -4px;
      animation-delay: 0.12s;
    }

    @keyframes extra-fall {
      0% {
        opacity: 0;
        transform: translate(0, 0) scale(0.5);
      }
      15% {
        opacity: 1;
        transform: translate(0, 10px) scale(1.2);
      }
      85% {
        opacity: 1;
        transform: translate(var(--edrift, 0), 72px) scale(0.9);
      }
      100% {
        opacity: 0;
        transform: translate(var(--edrift, 0), 76px) scale(0.2);
      }
    }

    /* Respect reduced-motion preferences */
    @media (prefers-reduced-motion: reduce) {
      .spoon-group,
      .stew-wave,
      .stew-wave-inner,
      .bubble,
      .steam-wisp,
      .seasoning-hand,
      .spice-particle,
      .splash-ripple,
      .extra-particle {
        animation: none !important;
        opacity: 0.7 !important;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly titleService = inject(Title);

  readonly title = input<string>();
  readonly itemType = input<string>();

  readonly resolvedNoun = computed(() => {
    return (
      this.resolveFromQueryParams() ??
      this.resolveFromRouteData() ??
      this.resolveFromInput() ??
      this.resolveFromHistoryState() ??
      this.resolveFromUrl() ??
      'page'
    );
  });

  private cleanNoun(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      return trimmed || null;
    }
    return null;
  }

  private resolveFromInput(): string | null {
    return this.cleanNoun(this.itemType()) ?? this.deduceNounFromTitle(this.title());
  }

  private resolveFromRouteData(): string | null {
    const data = this.route?.snapshot?.data;
    if (!data) return null;
    return this.cleanNoun(data['itemType']) ?? this.deduceNounFromTitle(data['title']);
  }

  private resolveFromQueryParams(): string | null {
    const params = this.route?.snapshot?.queryParamMap;
    if (!params) return null;
    return this.cleanNoun(params.get('itemType')) ?? this.deduceNounFromTitle(params.get('title'));
  }

  private resolveFromHistoryState(): string | null {
    const state =
      typeof history !== 'undefined'
        ? (history.state as Record<string, unknown> | undefined)
        : undefined;
    if (!state) return null;
    return this.cleanNoun(state['itemType']) ?? this.deduceNounFromTitle(state['title']);
  }

  private resolveFromUrl(): string | null {
    const url = (
      this.router?.url ||
      this.route?.snapshot?.url?.map((u) => u.path).join('/') ||
      ''
    ).toLowerCase();

    if (/(?:^|\/)recipe(?:\/|$|\?)/.test(url)) return 'recipe';
    if (/(?:^|\/)tag(?:\/|$|\?)/.test(url)) return 'tag';
    if (url.includes('/search')) return 'search result';
    if (
      /(?:^|\/)(?:recipes|methods|holidays|special-diets|the-best-recipes)(?:\/|$|\?)/.test(url)
    ) {
      return 'collection';
    }
    return null;
  }

  readonly resolvedLabel = computed(() => {
    const noun = this.resolvedNoun();
    if (!noun) return 'Page';
    return noun
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  });

  readonly resolvedTitle = computed(() => {
    const qTitle = this.route?.snapshot?.queryParamMap?.get('title')?.trim();
    if (qTitle) return qTitle;

    const dataTitle = (this.route?.snapshot?.data?.['title'] as string | undefined)?.trim();
    if (dataTitle) return dataTitle;

    const inputTitle = this.title()?.trim();
    if (inputTitle) return inputTitle;

    return `${this.resolvedLabel()} Not Found`;
  });

  private deduceNounFromTitle(title: unknown): string | null {
    if (typeof title !== 'string') return null;
    const clean = title.trim();
    if (!clean) return null;
    const notFoundSuffixRegex = /\s+Not\s+Found$/i;
    if (notFoundSuffixRegex.test(clean)) {
      return clean.replace(notFoundSuffixRegex, '').trim().toLowerCase();
    }
    const lower = clean.toLowerCase();
    if (lower.includes('recipe')) return 'recipe';
    if (lower.includes('tag')) return 'tag';
    if (lower.includes('collection')) return 'collection';
    if (lower.includes('dish')) return 'dish';
    if (lower.includes('search')) return 'search result';
    if (lower.includes('page')) return 'page';
    return null;
  }

  constructor() {
    effect(() => {
      const title = this.resolvedTitle();
      this.titleService.setTitle(`${title} | Delisha Marie's Kitchen`);
    });
  }

  userSeasoningBursts = signal<number>(0);
  bursts = signal<number[]>([]);

  private readonly messages = [
    'Simmering to perfection on the back burner...',
    'A pinch of sea salt added!',
    'A dash of smoked paprika tossed in!',
    'A pinch of garden-fresh thyme sprinkled!',
    'Cracked black pepper stirred into the stew!',
    'Chef Delisha approves this flavorful creation! 👩‍🍳',
  ];

  seasoningMessage = signal<string>(this.messages[0]);

  addSeasoning(): void {
    const nextCount = this.userSeasoningBursts() + 1;
    this.userSeasoningBursts.set(nextCount);
    this.bursts.update((b) => [...b, nextCount]);
    const msgIndex = Math.min(nextCount, this.messages.length - 1);
    this.seasoningMessage.set(this.messages[msgIndex]);
  }
}
