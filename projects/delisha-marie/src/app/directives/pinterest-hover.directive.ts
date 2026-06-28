import { DOCUMENT } from '@angular/common';
import { Directive, OnDestroy, Renderer2, inject, input } from '@angular/core';
import { Recipe } from '../services/recipe.service';

@Directive({
  selector: '[dmPinterestHover]',
  host: {
    '(mouseover)': 'onMouseOver($event)',
    '(mouseout)': 'onMouseOut($event)',
  },
})
export class PinterestHoverDirective implements OnDestroy {
  recipe = input.required<Recipe>({ alias: 'dmPinterestHover' });

  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  private buttonEl: HTMLElement | null = null;
  private activeImg: HTMLImageElement | null = null;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private buttonMouseEnterListener: (() => void) | null = null;
  private buttonMouseLeaveListener: (() => void) | null = null;
  private buttonClickListener: (() => void) | null = null;

  onMouseOver(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target?.tagName === 'IMG') {
      const img = target as HTMLImageElement;

      if (this.activeImg === img) {
        this.clearHideTimeout();
        return;
      }

      this.activeImg = img;
      this.clearHideTimeout();
      this.createAndShowButton();
    }
  }

  onMouseOut(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target?.tagName === 'IMG') {
      this.startHideTimeout();
    }
  }

  private createAndShowButton() {
    const window = this.document.defaultView;
    if (!window || !this.activeImg) return;

    if (this.buttonEl) {
      this.positionButton();
      return;
    }

    this.buttonEl = this.renderer.createElement('button');
    this.renderer.setAttribute(this.buttonEl, 'id', 'pinterest-hover-btn');

    const styles = {
      position: 'absolute', 'z-index': '40',
      display: 'flex', 'align-items': 'center', 
      gap: '6px', 'background-color': '#e60023',
      color: 'white', 
      border: 'none', 'border-radius': '9999px', 
      padding: '8px 14px',
        'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'font-weight': '700', 'font-size': '14px',
      cursor: 'pointer', 'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.2)',
      transition: 'transform 0.15s ease, background-color 0.15s ease',
    };

    Object.entries(styles).forEach(([prop, val]) => {
      this.renderer.setStyle(this.buttonEl, prop, val);
    });

    const svgHtml = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display: block;">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.63 11.16-.1-.95-.2-2.4.04-3.43.22-.93 1.4-5.93 1.4-5.93s-.36-.72-.36-1.77c0-1.66.96-2.9 2.16-2.9 1.02 0 1.51.77 1.51 1.68 0 1.03-.65 2.56-.99 3.98-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.55-5.4 5.2 0 1.03.4 2.14.9 2.75.1.12.1.22.08.33l-.33 1.35c-.05.2-.18.25-.4.15-1.5-.7-2.42-2.9-2.42-4.66 0-3.8 2.76-7.27 7.94-7.27 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.47-6.23 7.47-1.22 0-2.37-.63-2.76-1.37l-.75 2.87c-.27 1.05-1 2.37-1.5 3.18C9.8 23.6 10.88 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
      </svg>
      <span>Save</span>
    `;
    this.buttonEl!.innerHTML = svgHtml;

    this.positionButton();
    this.renderer.appendChild(this.document.body, this.buttonEl);

    this.buttonMouseEnterListener = this.renderer.listen(this.buttonEl, 'mouseenter', () => {
      this.clearHideTimeout();
      this.renderer.setStyle(this.buttonEl, 'transform', 'scale(1.05)');
      this.renderer.setStyle(this.buttonEl, 'background-color', '#ad081b');
    });

    this.buttonMouseLeaveListener = this.renderer.listen(this.buttonEl, 'mouseleave', () => {
      this.renderer.setStyle(this.buttonEl, 'transform', 'scale(1)');
      this.renderer.setStyle(this.buttonEl, 'background-color', '#e60023');
      this.startHideTimeout();
    });

    this.buttonClickListener = this.renderer.listen(this.buttonEl, 'click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPinterest();
    });
  }

  private positionButton() {
    if (!this.activeImg || !this.buttonEl) return;
    const rect = this.activeImg.getBoundingClientRect();
    const window = this.document.defaultView;
    if (!window) return;

    const top = rect.top + window.scrollY + 12;
    const left = rect.left + window.scrollX + 12;

    this.renderer.setStyle(this.buttonEl, 'top', `${top}px`);
    this.renderer.setStyle(this.buttonEl, 'left', `${left}px`);
  }

  private openPinterest() {
    const window = this.document.defaultView;
    if (!window || !this.activeImg) return;

    const r = this.recipe();
    const url = encodeURIComponent(window.location.href);
    const media = encodeURIComponent(this.activeImg.src || r.image || '');
    const description = encodeURIComponent(r.title || '');

    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`;
    window.open(pinterestUrl, 'pinterestShare', 'width=890,height=600,noreferrer');
  }

  private startHideTimeout() {
    this.clearHideTimeout();
    this.hideTimeoutId = setTimeout(() => {
      this.removeButton();
    }, 200);
  }

  private clearHideTimeout() {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }

  private removeButton() {
    if (this.buttonEl) {
      if (this.buttonMouseEnterListener) this.buttonMouseEnterListener();
      if (this.buttonMouseLeaveListener) this.buttonMouseLeaveListener();
      if (this.buttonClickListener) this.buttonClickListener();

      this.buttonMouseEnterListener = null;
      this.buttonMouseLeaveListener = null;
      this.buttonClickListener = null;

      if (this.buttonEl.parentNode) {
        this.renderer.removeChild(this.document.body, this.buttonEl);
      }
      this.buttonEl = null;
      this.activeImg = null;
    }
  }

  ngOnDestroy() {
    this.clearHideTimeout();
    this.removeButton();
  }
}
