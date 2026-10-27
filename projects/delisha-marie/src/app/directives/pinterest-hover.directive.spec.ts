import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Recipe } from '../services/recipe.service';
import { createMockRecipe } from '../utils/test-recipe';
import { PinterestHoverDirective } from './pinterest-hover.directive';

@Component({
  imports: [PinterestHoverDirective],
  template: `
    <div [dmPinterestHover]="recipe" id="test-container" style="padding: 100px;">
      <img id="test-img" src="test.jpg" alt="Test Image" style="width: 200px; height: 200px;" />
      <img
        id="test-img-2"
        src="test2.jpg"
        alt="Second Test Image"
        style="width: 200px; height: 200px;" />
      <span id="test-span">Non image element</span>
    </div>
  `,
})
class TestComponent {
  recipe: Recipe = createMockRecipe({
    title: 'Test Recipe Title',
    image: 'test.jpg',
  });
}

describe('PinterestHoverDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let imgEl: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [TestComponent, PinterestHoverDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    const imgDebug = fixture.debugElement.query(By.css('#test-img'));
    imgEl = imgDebug.nativeElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    const btn = document.getElementById('pinterest-hover-btn');
    if (btn && btn.parentNode) {
      btn.parentNode.removeChild(btn);
    }
  });

  it('should append Pinterest button to body when hovering an image inside container', () => {
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn = document.getElementById('pinterest-hover-btn');
    expect(btn).toBeTruthy();
    expect(btn?.textContent?.trim()).toBe('Save');
  });

  it('should remove Pinterest button after delay when mouse leaves the image', () => {
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    expect(document.getElementById('pinterest-hover-btn')).toBeTruthy();

    imgEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(document.getElementById('pinterest-hover-btn')).toBeNull();
  });

  it('should not remove button if mouse enters the button before timeout', () => {
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn = document.getElementById('pinterest-hover-btn')!;
    imgEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    fixture.detectChanges();

    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(document.getElementById('pinterest-hover-btn')).toBeTruthy();
  });

  it('should remove button if mouse leaves the button after entering it', () => {
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn = document.getElementById('pinterest-hover-btn')!;

    imgEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    btn.dispatchEvent(new Event('mouseenter'));

    btn.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(document.getElementById('pinterest-hover-btn')).toBeNull();
  });

  it('should trigger window.open when button is clicked', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn = document.getElementById('pinterest-hover-btn')!;
    btn.dispatchEvent(new Event('click'));

    expect(openSpy).toHaveBeenCalled();
    const urlArg = openSpy.mock.calls[0][0] as string;
    expect(urlArg).toContain('pinterest.com/pin/create/button');
    expect(urlArg).toContain('media=');
    expect(urlArg).toContain('test.jpg');
    expect(urlArg).toContain('description=Test%20Recipe%20Title');

    openSpy.mockRestore();
  });

  it('should position button over the image', () => {
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn = document.getElementById('pinterest-hover-btn')!;
    expect(btn.style.position).toBe('absolute');
    expect(btn.style.top).toBeDefined();
    expect(btn.style.left).toBeDefined();
  });

  it('should reuse existing button if mouse enters again before it is removed', () => {
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn1 = document.getElementById('pinterest-hover-btn');

    imgEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn2 = document.getElementById('pinterest-hover-btn');
    expect(btn1).toBe(btn2);
  });

  it('should ignore mouseover and mouseout on non-IMG targets', () => {
    const spanEl = fixture.debugElement.query(By.css('#test-span')).nativeElement as HTMLElement;
    spanEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();
    expect(document.getElementById('pinterest-hover-btn')).toBeNull();

    spanEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    fixture.detectChanges();
    expect(document.getElementById('pinterest-hover-btn')).toBeNull();
  });

  it('should reposition existing button when hovering a different image', () => {
    const img2El = fixture.debugElement.query(By.css('#test-img-2')).nativeElement as HTMLElement;

    // Hover first image
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();
    const btn = document.getElementById('pinterest-hover-btn');
    expect(btn).toBeTruthy();

    // Hover second image immediately without timeout
    img2El.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const buttons = document.querySelectorAll('#pinterest-hover-btn');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toBe(btn);
  });

  it('should fallback to empty media and description when recipe attributes and activeImg src are missing', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    fixture.componentInstance.recipe = createMockRecipe({
      title: '',
      image: '',
    });
    fixture.detectChanges();

    const imgDebug = fixture.debugElement.query(By.css('#test-img'));
    imgDebug.nativeElement.removeAttribute('src');

    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();

    const btn = document.getElementById('pinterest-hover-btn')!;
    btn.dispatchEvent(new Event('click'));

    expect(openSpy).toHaveBeenCalled();
    const urlArg = openSpy.mock.calls[0][0] as string;
    expect(urlArg).toContain('media=');
    expect(urlArg).toContain('description=');
    openSpy.mockRestore();
  });

  it('should clean up button and timers on destroy', () => {
    imgEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    fixture.detectChanges();
    expect(document.getElementById('pinterest-hover-btn')).toBeTruthy();

    fixture.destroy();
    expect(document.getElementById('pinterest-hover-btn')).toBeNull();
  });
});
