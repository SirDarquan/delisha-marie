import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndexIngredients } from './recipe-index-ingredients';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    // Mock scrollIntoView in JSDOM
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

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

  it('should render jump links as buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('nav button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('A');
  });

  it('should render (back to top) buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backToTopButtons = compiled.querySelectorAll('button');
    // 2 jump links + 2 back-to-top buttons = 4 total
    expect(backToTopButtons.length).toBe(4);
    expect(backToTopButtons[2].textContent).toContain('(back to top)');
  });

  it('should call scrollToSection when a jump link is clicked', () => {
    const spy = vi.spyOn(component, 'scrollToSection');
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('nav button') as HTMLButtonElement;
    button.click();
    expect(spy).toHaveBeenCalledWith('A');
  });

  it('should call scrollToSection when (back to top) is clicked', () => {
    const spy = vi.spyOn(component, 'scrollToSection');
    const compiled = fixture.nativeElement as HTMLElement;
    const backToTopButtons = compiled.querySelectorAll('button');
    const backToTopButton = backToTopButtons[2] as HTMLButtonElement;
    backToTopButton.click();
    expect(spy).toHaveBeenCalledWith('recipe-by-ingredients');
  });

  it('should render counts in parentheses', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('(46)');
    expect(compiled.textContent).toContain('(15)');
  });

  it('should do nothing in scrollToSection if platform is server', () => {
    const spy = vi.spyOn(document, 'getElementById');
    const compAny = component as any;
    const originalPlatformId = compAny.platformId;
    compAny.platformId = 'server';
    component.scrollToSection('A');
    compAny.platformId = originalPlatformId;
    expect(spy).not.toHaveBeenCalled();
  });

  it('should do nothing in scrollToSection if element is not found', () => {
    const originalGetElementById = document.getElementById;
    const spy = vi.spyOn(document, 'getElementById').mockImplementation(function (id) {
      if (id === 'NonExistent') return null;
      return originalGetElementById.call(document, id);
    });
    component.scrollToSection('NonExistent');
    expect(spy).toHaveBeenCalledWith('NonExistent');
    spy.mockRestore();
  });

  it('should do nothing in scrollToSection if scrollIntoView is not a function', () => {
    const originalGetElementById = document.getElementById;
    const mockElement = { scrollIntoView: undefined } as unknown as HTMLElement;
    const spy = vi.spyOn(document, 'getElementById').mockImplementation(function (id) {
      if (id === 'A') return mockElement;
      return originalGetElementById.call(document, id);
    });
    component.scrollToSection('A');
    expect(spy).toHaveBeenCalledWith('A');
    spy.mockRestore();
  });
});
