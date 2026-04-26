import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeCard } from './recipe-card';
import { describe, it, expect, beforeEach } from 'vitest';
import { Recipe } from '../../services/recipe.service';

import { provideRouter } from '@angular/router';

describe('RecipeCard', () => {
  let component: RecipeCard;
  let fixture: ComponentFixture<RecipeCard>;

  const mockRecipe: Recipe = {
    id: '1',
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
    equipment: ['Pan', 'Oven'],
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
  };

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

  it('should render recipe title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Test Recipe');
  });

  it('should render all ingredients', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Equipment + Ingredients + Notes? No, sections are separate.
    // Ingredients section ul
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
    const steps = instructionsSection?.querySelectorAll('div.flex.gap-6');
    expect(steps?.length).toBe(2);
  });

  it('should render nutritional information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('100'); // Calories
    expect(compiled.textContent).toContain('1 portion'); // Serving size
  });

  it('should render equipment if provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pan');
    expect(compiled.textContent).toContain('Oven');
  });

  it('should render notes if provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Note 1');
  });
});
