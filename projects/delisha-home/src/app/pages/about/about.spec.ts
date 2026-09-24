import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { About } from './about';

describe('About', () => {
  let component: About;
  let fixture: ComponentFixture<About>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the about page', () => {
    expect(component).toBeTruthy();
  });

  it('should render colored header with About Delisha Marie', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-colored-header')).toBeTruthy();
    expect(compiled.querySelector('h1')?.textContent).toContain('About');
    expect(compiled.querySelector('h1')?.textContent).toContain('Delisha Marie');
    expect(compiled.querySelector('article')).toBeTruthy();
    expect(compiled.textContent).toContain('The Culinary Journey');
  });

  it('should render philosophy cards and Kitchen call to action link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Real Ingredients');
    expect(compiled.textContent).toContain('Soul & Heritage');
    expect(compiled.textContent).toContain('Kitchen Mastery');

    const ctaLink = compiled.querySelector('section a');
    expect(ctaLink).toBeTruthy();
    expect(ctaLink?.getAttribute('href')).toBe(component.kitchenUrl);
    expect(ctaLink?.textContent).toContain('Visit the Kitchen');
  });
});
