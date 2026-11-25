export interface RecipeEmailMetadata {
  slug?: string;
  title?: string;
  image?: string;
  description?: string;
}

export interface SendRecipeEventDetail {
  email: string;
  recipeSlug?: string;
  recipeTitle?: string;
  recipeUrl?: string;
  recipeImage?: string;
  recipeDescription?: string;
  subscribeNewsletter?: boolean;
  resolve?: () => void;
  reject?: (reason?: unknown) => void;
}

/**
 * Numbers controlling the window dim spotlight effect:
 * - dimAmount: How dark to dim the window (0 = no dim, 1 = pitch black). E.g. 0.65 = 65% darkness.
 * - fadeInDurationMs: Transition speed to dim out. E.g. 0 for instant, 400 for quick.
 * - holdDurationMs: How long the window stays dimmed out before returning to normal in ms (e.g. 2500 = 2.5s).
 * - fadeOutDurationMs: Transition speed to fade back to normal in ms.
 */
export interface DimSpotlightConfig {
  /** The amount the window is dimmed out (0 to 1, e.g. 0.65 = 65% dimmed) */
  dimAmount: number;
  /** How the dimming starts in ms (0 for instant, 400 for quick smooth transition) */
  fadeInDurationMs: number;
  /** The time the window remains dimmed out in ms */
  holdDurationMs: number;
  /** How the dimming goes backwards and ends in ms */
  fadeOutDurationMs: number;
}

export const DEFAULT_DIM_SPOTLIGHT_CONFIG: DimSpotlightConfig = {
  dimAmount: 0.65,
  fadeInDurationMs: 400,
  holdDurationMs: 2500,
  fadeOutDurationMs: 500,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function triggerSpotlightDim(
  mountEl: HTMLElement,
  config: DimSpotlightConfig = DEFAULT_DIM_SPOTLIGHT_CONFIG,
): () => void {
  const card = (mountEl.firstElementChild as HTMLElement) || mountEl;

  // Clean up any existing overlay
  document.querySelectorAll('.email-recipe-spotlight-backdrop').forEach((el) => el.remove());

  // Create fixed fullscreen dimming backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'email-recipe-spotlight-backdrop';
  backdrop.style.position = 'fixed';
  backdrop.style.inset = '0';
  backdrop.style.backgroundColor = '#000000';
  backdrop.style.opacity = '0';
  backdrop.style.zIndex = '9998';
  backdrop.style.pointerEvents = 'none';
  backdrop.style.transition = `opacity ${config.fadeInDurationMs}ms ease-out`;

  document.body.appendChild(backdrop);

  // Elevate the email recipe widget card above the backdrop
  const origPosition = card.style.position;
  const origZIndex = card.style.zIndex;
  const origTransition = card.style.transition;
  const origBoxShadow = card.style.boxShadow;

  card.style.position = 'relative';
  card.style.zIndex = '9999';
  card.style.transition = `box-shadow ${config.fadeInDurationMs}ms ease-out`;
  card.style.boxShadow =
    '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 2px var(--mat-sys-primary, #6750a4)';

  let cleanedUp = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let exitObserver: IntersectionObserver | null = null;

  const dismiss = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (timerId) clearTimeout(timerId);
    if (exitObserver) {
      exitObserver.disconnect();
      exitObserver = null;
    }

    backdrop.style.transition = `opacity ${config.fadeOutDurationMs}ms ease-in`;
    backdrop.style.opacity = '0';
    card.style.boxShadow = origBoxShadow;

    setTimeout(() => {
      backdrop.remove();
      card.style.position = origPosition;
      card.style.zIndex = origZIndex;
      card.style.transition = origTransition;
    }, config.fadeOutDurationMs);
  };

  // If the email recipe box goes out of the window, immediately reverse and end the trigger
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const rect = mountEl.getBoundingClientRect();
    const isInViewport =
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth);
    let hasEnteredViewport = isInViewport;

    exitObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            hasEnteredViewport = true;
          } else if (hasEnteredViewport && !entry.isIntersecting) {
            dismiss();
          }
        }
      },
      {
        threshold: 0,
      },
    );
    exitObserver.observe(mountEl);
  }

  // Fade in on next animation frame
  requestAnimationFrame(() => {
    backdrop.style.opacity = String(config.dimAmount);
  });

  // Hold for the specified time, then fade back to normal
  timerId = setTimeout(() => {
    dismiss();
  }, config.fadeInDurationMs + config.holdDurationMs);

  return dismiss;
}

export function mountEmailRecipe(
  container: HTMLElement,
  recipe?: RecipeEmailMetadata | null,
  dimConfig?: Partial<DimSpotlightConfig>,
): HTMLElement | null {
  if (!container) return null;

  const config: DimSpotlightConfig = {
    ...DEFAULT_DIM_SPOTLIGHT_CONFIG,
    ...dimConfig,
  };

  const recipeSlug = recipe?.slug || '';

  // Preserve existing widget if already mounted for this recipe
  const existing = container.querySelector<HTMLElement>('.email-recipe-mount');
  if (existing && existing.dataset['recipeSlug'] === recipeSlug) {
    return existing;
  }

  // Remove stale instance from another recipe
  if (existing) {
    existing.remove();
  }

  // Locate paragraphs within the story
  const paragraphs = container.querySelectorAll('p');
  const target =
    paragraphs.length >= 2
      ? paragraphs[1] // Right after the 2nd paragraph
      : paragraphs.length === 1
        ? paragraphs[0] // Right after the 1st paragraph
        : container.firstElementChild || container;

  // Create wrapper container
  const mountEl = document.createElement('div');
  mountEl.className = 'email-recipe-mount my-8 not-prose';
  mountEl.dataset['recipeSlug'] = recipeSlug;
  mountEl.innerHTML = `
    <div class="bg-[var(--mat-sys-surface-container-highest)] border border-[var(--mat-sys-outline-variant)] rounded-3xl p-6 sm:p-8 shadow-sm">
      <div class="flex items-start gap-4 mb-4">
        <div class="bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] p-3 rounded-2xl shrink-0 flex items-center justify-center">
          <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
        <div>
          <h3 class="text-xl sm:text-2xl font-black m-0 mb-1 leading-tight text-[var(--mat-sys-on-surface)]">
            Email Me This Recipe!
          </h3>
          <p class="text-sm sm:text-base opacity-80 m-0 text-[var(--mat-sys-on-surface-variant)]">
            Send the full ingredient list and instructions directly to your inbox for easy shopping and cooking.
          </p>
        </div>
      </div>

      <div class="email-recipe-feedback hidden" role="status" aria-live="polite"></div>

      <form class="email-recipe-form flex flex-col gap-3 mt-4">
        <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div class="flex-1 relative">
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your email address"
              aria-label="Email address for recipe"
              class="w-full px-4 py-3 rounded-xl border border-[var(--mat-sys-outline-variant)] bg-[var(--mat-sys-surface)] text-[var(--mat-sys-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mat-sys-primary)]"
            />
          </div>
          <button
            type="submit"
            aria-label="Send recipe to email"
            class="rounded-full px-7 h-12 text-base font-bold shrink-0 bg-[var(--mat-sys-primary)] text-[var(--mat-sys-on-primary)] hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
            <span class="btn-text">Send Recipe</span>
          </button>
        </div>

        <label class="flex items-center gap-2.5 text-sm cursor-pointer select-none text-[var(--mat-sys-on-surface-variant)] mt-1">
          <input
            type="checkbox"
            name="subscribe"
            checked
            class="rounded accent-[var(--mat-sys-primary)] h-4 w-4 cursor-pointer"
          />
          <span>Also subscribe to the Delisha Marie weekly newsletter</span>
        </label>
      </form>
    </div>
  `;

  if (target === container) {
    container.appendChild(mountEl);
  } else {
    target.insertAdjacentElement('afterend', mountEl);
  }

  // Attach scroll spotlight dim observer (triggers once when near middle of screen)
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    let hasTriggered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasTriggered) {
            hasTriggered = true;
            observer.disconnect();
            triggerSpotlightDim(mountEl, config);
          }
        }
      },
      {
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.1,
      },
    );
    observer.observe(mountEl);
  }

  // Attach Vanilla JS Form Handling
  const form = mountEl.querySelector<HTMLFormElement>('.email-recipe-form');
  const card = mountEl.firstElementChild as HTMLElement;
  const feedback = mountEl.querySelector<HTMLElement>('.email-recipe-feedback');

  if (form && card && feedback) {
    let isSubmitting = false;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
      const subscribeInput = form.querySelector<HTMLInputElement>('input[name="subscribe"]');
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const btnText = submitBtn?.querySelector<HTMLElement>('.btn-text');

      const email = emailInput?.value?.trim() || '';
      if (!EMAIL_REGEX.test(email)) {
        feedback.className =
          'email-recipe-feedback bg-[var(--mat-sys-error-container)] text-[var(--mat-sys-on-error-container)] p-3.5 rounded-xl flex items-center gap-3 text-sm mb-4 border border-[var(--mat-sys-error)]/20';
        feedback.innerHTML = '<span class="font-medium">Please enter a valid email address.</span>';
        feedback.classList.remove('hidden');
        emailInput?.focus();
        return;
      }

      isSubmitting = true;
      if (submitBtn && btnText) {
        submitBtn.disabled = true;
        btnText.textContent = 'Sending...';
      }
      feedback.classList.add('hidden');

      try {
        await new Promise<void>((resolve, reject) => {
          const customEvent = new CustomEvent<SendRecipeEventDetail>('sendRecipe', {
            bubbles: true,
            cancelable: true,
            detail: {
              email,
              recipeSlug: recipe?.slug || '',
              recipeTitle: recipe?.title || '',
              recipeUrl: typeof window !== 'undefined' ? window.location.href : '',
              recipeImage: recipe?.image || '',
              recipeDescription: recipe?.description || '',
              subscribeNewsletter: subscribeInput ? subscribeInput.checked : true,
              resolve: () => resolve(),
              reject: (reason?: unknown) => reject(reason),
            },
          });
          mountEl.dispatchEvent(customEvent);
        });

        // Render Vanilla Success State
        card.innerHTML = `
          <div role="status" aria-live="polite" class="bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] p-5 rounded-2xl flex items-center gap-4 border border-[var(--mat-sys-primary)]/20 shadow-sm">
            <svg class="w-8 h-8 fill-[var(--mat-sys-primary)] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div>
              <p class="m-0 font-bold text-base leading-snug">It submitted!</p>
              <p class="m-0 text-sm opacity-90">Check your inbox for the recipe.</p>
            </div>
          </div>
        `;
      } catch {
        isSubmitting = false;
        if (submitBtn && btnText) {
          submitBtn.disabled = false;
          btnText.textContent = 'Send Recipe';
        }
        feedback.className =
          'email-recipe-feedback bg-[var(--mat-sys-error-container)] text-[var(--mat-sys-on-error-container)] p-3.5 rounded-xl flex items-center gap-3 text-sm mb-4 border border-[var(--mat-sys-error)]/20';
        feedback.innerHTML =
          '<span class="font-medium">Something went wrong. Please try again.</span>';
        feedback.classList.remove('hidden');
      }
    });
  }

  return mountEl;
}
