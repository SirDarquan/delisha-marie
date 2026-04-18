import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndex } from './recipe-index';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RecipeIndex', () => {
  let component: RecipeIndex;
  let fixture: ComponentFixture<RecipeIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeIndex],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Recipe Index title with Material classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.textContent).toContain('Recipe Index');
    expect(h1?.classList.contains('mat-headline-medium')).toBe(true);
  });

  it('should render 6 category navigation buttons with ARIA labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const categories = compiled.querySelectorAll('nav button');
    expect(categories.length).toBe(6);
    expect(categories[0].getAttribute('aria-label')).toContain('Browse Appetizers');
  });

  it('should render the placeholders grid with accessibility roles', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const list = compiled.querySelector('[role="list"]');
    const items = compiled.querySelectorAll('[role="listitem"]');
    expect(list).toBeTruthy();
    expect(items.length).toBe(6);
    expect(items[0].tagName.toLowerCase()).toBe('mat-card');
  });
});
