import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndex } from './recipe-index';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecipeIndexService } from '../../services/recipe-index.service';
import { of } from 'rxjs';

describe('RecipeIndex', () => {
  let component: RecipeIndex;
  let fixture: ComponentFixture<RecipeIndex>;

  beforeEach(async () => {
    const mockCategories = [
      { name: 'Appetizers', image: 'test.png', url: '/test' },
      { name: 'Breakfast', image: 'test.png', url: '/test' },
      { name: 'Main Dishes', image: 'test.png', url: '/test' },
      { name: 'Sides', image: 'test.png', url: '/test' },
      { name: 'Salads', image: 'test.png', url: '/test' },
      { name: 'Soups', image: 'test.png', url: '/test' },
      { name: 'Breads', image: 'test.png', url: '/test' },
      { name: 'Desserts', image: 'test.png', url: '/test' },
    ];

    await TestBed.configureTestingModule({
      imports: [RecipeIndex],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RecipeIndexService,
          useValue: {
            getFeaturedCategories: () => of(mockCategories),
          },
        },
      ],
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

  it('should render 8 category navigation links with ARIA labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const categories = compiled.querySelectorAll('nav[aria-label="Recipe categories"] a');
    expect(categories.length).toBe(8);
    expect(categories[0].getAttribute('aria-label')).toContain('Browse Appetizers');
  });

  it('should render the placeholders grid with accessibility roles', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const list = compiled.querySelector('[role="list"]');
    const items = compiled.querySelectorAll('[role="listitem"]');
    expect(list).toBeTruthy();
    expect(items.length).toBe(6);
  });
});
