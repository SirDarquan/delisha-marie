import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Stars } from './stars';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

describe('Stars', () => {
  let component: Stars;
  let fixture: ComponentFixture<Stars>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Stars],
    }).compileComponents();

    fixture = TestBed.createComponent(Stars);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 5 star buttons', () => {
    const starButtons = fixture.debugElement.queryAll(By.css('.star-wrapper'));
    expect(starButtons.length).toBe(5);
  });

  it('should reflect the input rating', async () => {
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();

    const activeStars = fixture.debugElement.queryAll(By.css('.star-icon.active'));
    expect(activeStars.length).toBe(3);
  });

  it('should handle hover in interactive mode', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();

    const secondStar = fixture.debugElement.queryAll(By.css('.star-wrapper'))[1];
    secondStar.triggerEventHandler('mouseenter', null);
    fixture.detectChanges();

    expect(component['hoverRating']()).toBe(2);
    const hoveringStars = fixture.debugElement.queryAll(By.css('.star-icon.hovering'));
    expect(hoveringStars.length).toBe(2);

    const container = fixture.debugElement.query(By.css('.flex'));
    container.triggerEventHandler('mouseleave', null);
    fixture.detectChanges();
    expect(component['hoverRating']()).toBeNull();
  });

  it('should emit ratingChange on click in interactive mode', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();

    const ratingChangeSpy = vi.spyOn(component.ratingChange, 'emit');
    const fourthStar = fixture.debugElement.queryAll(By.css('.star-wrapper'))[3];
    fourthStar.triggerEventHandler('click', null);

    expect(ratingChangeSpy).toHaveBeenCalledWith(4);
  });

  it('should toggle rating off if clicking current rating', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('rating', 4);
    fixture.detectChanges();

    const ratingChangeSpy = vi.spyOn(component.ratingChange, 'emit');
    const fourthStar = fixture.debugElement.queryAll(By.css('.star-wrapper'))[3];
    fourthStar.triggerEventHandler('click', null);

    expect(ratingChangeSpy).toHaveBeenCalledWith(0);
  });

  it('should not emit ratingChange if not interactive', () => {
    fixture.componentRef.setInput('interactive', false);
    fixture.detectChanges();

    const ratingChangeSpy = vi.spyOn(component.ratingChange, 'emit');
    const star = fixture.debugElement.query(By.css('.star-wrapper'));
    star.triggerEventHandler('click', null);

    expect(ratingChangeSpy).not.toHaveBeenCalled();
  });

  it('should return correct icon names', () => {
    fixture.componentRef.setInput('rating', 3.5);
    fixture.detectChanges();

    expect(component['getStarIcon'](3)).toBe('star');
    expect(component['getStarIcon'](4)).toBe('star_half');
    expect(component['getStarIcon'](5)).toBe('star_outline');
  });

  it('should treat half stars as active', () => {
    fixture.componentRef.setInput('rating', 3.5);
    fixture.detectChanges();

    const activeStars = fixture.debugElement.queryAll(By.css('.star-icon.active'));
    expect(activeStars.length).toBe(4); // 1, 2, 3 (full) + 4 (half)
  });

  it('should do nothing in mouse/click handlers if not interactive', () => {
    fixture.componentRef.setInput('interactive', false);
    fixture.detectChanges();

    const initialHover = component['hoverRating']();

    // Call protected handlers directly to cover early-return false branches
    component['onMouseEnter'](4);
    expect(component['hoverRating']()).toBe(initialHover);

    component['onMouseLeave']();
    expect(component['hoverRating']()).toBe(initialHover);

    const ratingChangeSpy = vi.spyOn(component.ratingChange, 'emit');
    component['handleRating'](4);
    expect(ratingChangeSpy).not.toHaveBeenCalled();
  });
});
