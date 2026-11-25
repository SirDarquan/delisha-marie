import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DIM_SPOTLIGHT_CONFIG,
  mountEmailRecipe,
  RecipeEmailMetadata,
  SendRecipeEventDetail,
  triggerSpotlightDim,
} from './mount-email-recipe';

describe('mountEmailRecipe', () => {
  let container: HTMLElement;
  const mockRecipe: RecipeEmailMetadata = {
    slug: 'creamy-garlic-salmon',
    title: 'Creamy Garlic Tuscan Salmon',
    image: 'https://example.com/salmon.jpg',
    description: 'A rich and creamy salmon recipe',
  };

  beforeEach(() => {
    container = document.createElement('div');
    vi.restoreAllMocks();
  });

  it('should return null if container is not provided', () => {
    // @ts-expect-error testing null input
    expect(mountEmailRecipe(null, mockRecipe)).toBeNull();
  });

  it('should mount widget after the second paragraph when 2 or more paragraphs exist', () => {
    container.innerHTML = `
      <p id="p1">First paragraph</p>
      <p id="p2">Second paragraph</p>
      <p id="p3">Third paragraph</p>
    `;

    const widget = mountEmailRecipe(container, mockRecipe);

    expect(widget).toBeTruthy();
    expect(widget?.classList.contains('email-recipe-mount')).toBe(true);

    const p2 = container.querySelector('#p2');
    expect(p2?.nextElementSibling).toBe(widget);
  });

  it('should mount widget after the first paragraph when only one paragraph exists', () => {
    container.innerHTML = `<p id="p1">Only one paragraph</p>`;

    const widget = mountEmailRecipe(container, mockRecipe);

    expect(widget).toBeTruthy();
    const p1 = container.querySelector('#p1');
    expect(p1?.nextElementSibling).toBe(widget);
  });

  it('should mount widget at the end when no paragraphs exist', () => {
    container.innerHTML = `<div id="div1">Not a paragraph</div>`;

    const widget = mountEmailRecipe(container, mockRecipe);

    expect(widget).toBeTruthy();
    expect(container.lastElementChild).toBe(widget);
  });

  it('should preserve and reuse existing widget if already mounted for the same slug', () => {
    container.innerHTML = `<p>Paragraph 1</p><p>Paragraph 2</p>`;

    const widget1 = mountEmailRecipe(container, mockRecipe);
    expect(widget1).toBeTruthy();

    const widget2 = mountEmailRecipe(container, mockRecipe);
    expect(widget2).toBe(widget1);
    expect(container.querySelectorAll('.email-recipe-mount').length).toBe(1);
  });

  it('should replace widget if recipe slug changes', () => {
    container.innerHTML = `<p>Paragraph 1</p><p>Paragraph 2</p>`;

    const widget1 = mountEmailRecipe(container, mockRecipe);
    expect(widget1?.dataset['recipeSlug']).toBe('creamy-garlic-salmon');

    const widget2 = mountEmailRecipe(container, {
      ...mockRecipe,
      slug: 'lemon-herb-chicken',
    });

    expect(widget2).not.toBe(widget1);
    expect(widget2?.dataset['recipeSlug']).toBe('lemon-herb-chicken');
    expect(container.querySelectorAll('.email-recipe-mount').length).toBe(1);
  });

  it('should initialize spotlight IntersectionObserver and trigger spotlight when intersecting', () => {
    let triggerCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | undefined;
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    class MockObserver {
      constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
        triggerCallback = callback;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
    }
    vi.stubGlobal('IntersectionObserver', MockObserver);

    container.innerHTML = `<p>Paragraph 1</p>`;
    const widget = mountEmailRecipe(container, mockRecipe);

    expect(observeSpy).toHaveBeenCalledWith(widget);

    // Trigger non-intersecting entry first (branch check)
    if (triggerCallback) {
      triggerCallback([{ isIntersecting: false }]);
    }
    expect(disconnectSpy).not.toHaveBeenCalled();

    // Trigger intersecting entry
    if (triggerCallback) {
      triggerCallback([{ isIntersecting: true }]);
    }
    expect(disconnectSpy).toHaveBeenCalled();

    // Subsequent intersecting entry is ignored
    if (triggerCallback) {
      triggerCallback([{ isIntersecting: true }]);
    }

    vi.unstubAllGlobals();
  });

  it('should show validation error when invalid email is entered', () => {
    container.innerHTML = `<p>Paragraph 1</p>`;
    const widget = mountEmailRecipe(container, mockRecipe)!;

    const form = widget.querySelector<HTMLFormElement>('.email-recipe-form')!;
    const emailInput = widget.querySelector<HTMLInputElement>('input[type="email"]')!;
    const feedback = widget.querySelector<HTMLElement>('.email-recipe-feedback')!;

    emailInput.value = 'invalid-email';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(feedback.classList.contains('hidden')).toBe(false);
    expect(feedback.textContent).toContain('Please enter a valid email address');
  });

  it('should dispatch sendRecipe CustomEvent and render success state when resolved', async () => {
    let capturedEvent: CustomEvent<SendRecipeEventDetail> | null = null;
    container.addEventListener('sendRecipe', ((e: CustomEvent<SendRecipeEventDetail>) => {
      capturedEvent = e;
      e.detail.resolve?.();
    }) as EventListener);

    container.innerHTML = `<p>Paragraph 1</p>`;
    const widget = mountEmailRecipe(container, mockRecipe)!;

    const form = widget.querySelector<HTMLFormElement>('.email-recipe-form')!;
    const emailInput = widget.querySelector<HTMLInputElement>('input[type="email"]')!;

    emailInput.value = 'chef@delishamarie.com';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent?.detail.email).toBe('chef@delishamarie.com');
      expect(capturedEvent?.detail.recipeSlug).toBe('creamy-garlic-salmon');
      expect(capturedEvent?.detail.recipeTitle).toBe('Creamy Garlic Tuscan Salmon');
    });

    await vi.waitFor(() => {
      expect(widget.textContent).toContain('It submitted!');
      expect(widget.textContent).toContain('Check your inbox for the recipe.');
    });
  });

  it('should display error feedback when custom event rejects', async () => {
    container.addEventListener('sendRecipe', ((e: CustomEvent<SendRecipeEventDetail>) => {
      e.detail.reject?.(new Error('Network error'));
    }) as EventListener);

    container.innerHTML = `<p>Paragraph 1</p>`;
    const widget = mountEmailRecipe(container, mockRecipe)!;

    const form = widget.querySelector<HTMLFormElement>('.email-recipe-form')!;
    const emailInput = widget.querySelector<HTMLInputElement>('input[type="email"]')!;
    const feedback = widget.querySelector<HTMLElement>('.email-recipe-feedback')!;

    emailInput.value = 'chef@delishamarie.com';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(feedback.classList.contains('hidden')).toBe(false);
      expect(feedback.textContent).toContain('Something went wrong. Please try again.');
    });
  });

  describe('Spotlight Dimming Effect', () => {
    beforeEach(() => {
      document.querySelectorAll('.email-recipe-spotlight-backdrop').forEach((el) => el.remove());
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      document.querySelectorAll('.email-recipe-spotlight-backdrop').forEach((el) => el.remove());
    });

    it('should have correct default spotlight dim config values', () => {
      expect(DEFAULT_DIM_SPOTLIGHT_CONFIG.dimAmount).toBe(0.65);
      expect(DEFAULT_DIM_SPOTLIGHT_CONFIG.fadeInDurationMs).toBe(400);
      expect(DEFAULT_DIM_SPOTLIGHT_CONFIG.holdDurationMs).toBe(2500);
      expect(DEFAULT_DIM_SPOTLIGHT_CONFIG.fadeOutDurationMs).toBe(500);
    });

    it('should inject backdrop and elevate card when triggerSpotlightDim is called', () => {
      const mountEl = document.createElement('div');
      mountEl.innerHTML = `<div class="card">Card content</div>`;
      document.body.appendChild(mountEl);

      const dismiss = triggerSpotlightDim(mountEl);

      const backdrop = document.querySelector<HTMLElement>('.email-recipe-spotlight-backdrop');
      expect(backdrop).not.toBeNull();
      expect(backdrop?.style.position).toBe('fixed');
      expect(backdrop?.style.zIndex).toBe('9998');

      const card = mountEl.firstElementChild as HTMLElement;
      expect(card.style.position).toBe('relative');
      expect(card.style.zIndex).toBe('9999');

      dismiss();
      mountEl.remove();
    });

    it('should dismiss and remove backdrop after fadeIn + hold + fadeOut durations', () => {
      const mountEl = document.createElement('div');
      mountEl.innerHTML = `<div class="card">Card content</div>`;
      document.body.appendChild(mountEl);

      triggerSpotlightDim(mountEl, {
        dimAmount: 0.8,
        fadeInDurationMs: 100,
        holdDurationMs: 500,
        fadeOutDurationMs: 200,
      });

      expect(document.querySelector('.email-recipe-spotlight-backdrop')).not.toBeNull();

      // Advance through fadeIn (100) + hold (500)
      vi.advanceTimersByTime(600);

      // Backdrop starts fading out (opacity 0)
      const backdrop = document.querySelector<HTMLElement>('.email-recipe-spotlight-backdrop');
      expect(backdrop?.style.opacity).toBe('0');

      // Advance fadeOut (200)
      vi.advanceTimersByTime(200);

      expect(document.querySelector('.email-recipe-spotlight-backdrop')).toBeNull();

      mountEl.remove();
    });

    it('should clean up prior backdrops when triggered multiple times', () => {
      const mountEl = document.createElement('div');
      mountEl.innerHTML = `<div class="card">Card content</div>`;
      document.body.appendChild(mountEl);

      triggerSpotlightDim(mountEl);
      expect(document.querySelectorAll('.email-recipe-spotlight-backdrop').length).toBe(1);

      triggerSpotlightDim(mountEl);
      expect(document.querySelectorAll('.email-recipe-spotlight-backdrop').length).toBe(1);

      mountEl.remove();
    });

    it('should immediately reverse and end trigger if box goes out of window', () => {
      let triggerCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | undefined;
      class MockObserver {
        constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
          triggerCallback = callback;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      }
      vi.stubGlobal('IntersectionObserver', MockObserver);

      const mountEl = document.createElement('div');
      mountEl.innerHTML = `<div class="card">Card content</div>`;
      document.body.appendChild(mountEl);

      triggerSpotlightDim(mountEl, {
        dimAmount: 0.7,
        fadeInDurationMs: 400,
        holdDurationMs: 5000,
        fadeOutDurationMs: 300,
      });

      const backdrop = document.querySelector<HTMLElement>('.email-recipe-spotlight-backdrop');
      expect(backdrop).not.toBeNull();

      // Simulate widget entering viewport initially
      if (triggerCallback) {
        triggerCallback([{ isIntersecting: true }]);
      }

      // Advance 100ms (still within fade-in / well before 5000ms hold)
      vi.advanceTimersByTime(100);

      // Now simulate user scrolling the box out of the window
      if (triggerCallback) {
        triggerCallback([{ isIntersecting: false }]);
      }

      // Immediately reverses: backdrop opacity set to 0 without waiting for 5000ms
      expect(backdrop?.style.opacity).toBe('0');

      // Advance fadeOutDurationMs (300ms)
      vi.advanceTimersByTime(300);

      expect(document.querySelector('.email-recipe-spotlight-backdrop')).toBeNull();

      mountEl.remove();
      vi.unstubAllGlobals();
    });
  });
});
