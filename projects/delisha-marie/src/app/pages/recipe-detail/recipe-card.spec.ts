import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Recipe } from '../../services/recipe.service';
import { RecipeCard } from './recipe-card';

import { provideRouter } from '@angular/router';

import { createMockRecipe } from '../../utils/test-recipe';

describe('RecipeCard', () => {
  let component: RecipeCard;
  let fixture: ComponentFixture<RecipeCard>;

  const mockRecipe: Recipe = createMockRecipe({
    id: '1',
    yield: '1 portion',
    title: 'Test Recipe',
    slug: 'test-recipe',
    description: 'A test recipe description',
    image: 'test-image.jpg',
    prepTime: '10 min',
    cookTime: '20 min',
    totalTime: '30 min',
    difficulty: 'Easy',
    author: 'Test Author',
    cuisine: 'Test Cuisine',
    course: 'Test Course',
    method: 'Test Method',
    category: 'Test Category',
    ingredients: ['Ingredient 1', 'Ingredient 2'],
    instructions: ['Step 1', 'Step 2'],

    notes: ['Note 1'],
    nutrition: {
      calories: '100',
      fat: '5g',
      carbohydrates: '10g',
      protein: '2g',
      fiber: '1g',
      sugar: '1g',
      sodium: '100mg',
      cholesterol: '10mg',
      saturatedFat: '1g',
      servingSize: '1 portion',
    },
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render author', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Author');
  });

  it('should render author as link if Delisha Marie', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, author: 'Delisha Marie' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[routerLink="/about"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Delisha Marie');
  });

  it('should render recipe title in header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-card-title')?.textContent).toContain('Test Recipe');
  });

  it('should render correct yield/servings', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-card-servings')?.textContent).toContain('1 portion');
  });

  it('should render prep, cook, and total times', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const times = Array.from(compiled.querySelectorAll('.recipe-card-time'));
    expect(times[0].textContent).toContain('10 min');
    expect(times[1].textContent).toContain('20 min');
    expect(times[2].textContent).toContain('30 min');
  });

  it('should render italic lowercase labels for metrics', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('.recipe-card-details-label');
    expect(label?.classList.contains('italic')).toBe(true);
    expect(label?.classList.contains('lowercase')).toBe(true);
  });

  it('should render "Be the first!" link when no rating', () => {
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      rating: 0,
      slug: '/recipe/test-recipe',
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');
    expect(link?.textContent).toContain('Be the first!');
    expect(link?.getAttribute('href')).toContain('#respond');
  });

  it('should render stars and count when rating exists', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, rating: 4.5, ratingCount: 12 });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dml-stars')).toBeTruthy();
    expect(compiled.querySelector('.rating-text')?.textContent).toContain('(12)');
  });

  it('should render all ingredients', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const ingredientsSection = Array.from(compiled.querySelectorAll('section')).find((s) =>
      s.textContent?.includes('Ingredients'),
    );
    const listItems = ingredientsSection?.querySelectorAll('li');
    expect(listItems?.length).toBe(2);
  });

  it('should render all instructions', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const instructionsSection = Array.from(compiled.querySelectorAll('section')).find((s) =>
      s.textContent?.includes('Instructions'),
    );
    const steps = instructionsSection?.querySelectorAll('.pt-2 p');
    expect(steps?.length).toBe(2);
  });

  it('should render nutritional information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('100'); // Calories
    expect(compiled.textContent).toContain('1 portion'); // Serving size
  });

  it('should render notes if provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Note 1');
  });

  it('should not render nutrition section if not provided', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, nutrition: undefined });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Nutritional Information');
  });

  it('should handle rating with missing ratingCount', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, rating: 5, ratingCount: undefined });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.rating-text')?.textContent).toContain('(0)');
  });
});
