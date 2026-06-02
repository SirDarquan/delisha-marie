import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndexIngredients } from './recipe-index-ingredients';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { Ingredient } from '../../models/category';

describe('RecipeIndexIngredients', () => {
  let component: RecipeIndexIngredients;
  let fixture: ComponentFixture<RecipeIndexIngredients>;

  const mockIngredients: Ingredient[] = [
    {
      name: 'Apple',
      url: '/ingredients/apple',
      count: 48,
      children: [
        { name: 'Apple Cider', url: '/ingredients/apple-cider', count: 6 },
        { name: 'Apple Cider Vinegar', url: '/ingredients/apple-cider-vinegar', count: 40 },
        { name: 'Apple Sauce', url: '/ingredients/apple-sauce' } as unknown as Ingredient, // No count to test child.count || 0
      ],
    },
    {
      name: 'Apricot', // Starts with 'A' to test !groups[letter] else branch
      url: '/ingredients/apricot',
    } as unknown as Ingredient,
    { name: 'Banana', url: '/ingredients/banana', count: 15 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeIndexIngredients],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndexIngredients);
    component = fixture.componentInstance;
    // Set required input
    fixture.componentRef.setInput('ingredients', mockIngredients);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should group ingredients alphabetically', () => {
    const groups = component.groupedIngredients();
    expect(groups.length).toBe(2);
    expect(groups[0].letter).toBe('A');
    expect(groups[1].letter).toBe('B');
  });

  it('should calculate parent sums correctly', () => {
    const appleItem = mockIngredients[0];
    const count = component.getItemCount(appleItem);
    expect(count).toBe(46); // 6 + 40
  });

  it('should render jump links with full path', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('nav a');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('A');
    expect((links[0] as HTMLAnchorElement).getAttribute('href')).toBe('/recipe-index#A');
  });

  it('should render (back to top) links with full path', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backToTop = compiled.querySelector('a[href="/recipe-index#recipe-by-ingredients"]');
    expect(backToTop).toBeTruthy();
    expect(backToTop?.textContent).toContain('(back to top)');
  });

  it('should render counts in parentheses', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('(46)');
    expect(compiled.textContent).toContain('(15)');
  });
});
