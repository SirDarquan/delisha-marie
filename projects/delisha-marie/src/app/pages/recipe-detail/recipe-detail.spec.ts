import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeDetail } from './recipe-detail';
import { Recipe } from '../../services/recipe.service';
import { provideRouter } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RecipeDetail', () => {
  let component: RecipeDetail;
  let fixture: ComponentFixture<RecipeDetail>;

  const mockRecipe: Recipe = {
    id: 1,
    title: 'Test Recipe',
    slug: 'test-recipe',
    description: 'A delicious test recipe',
    image: 'test.jpg',
    category: 'Desserts',
    subcategory: 'Cakes',
    prepTime: '10 mins',
    cookTime: '20 mins',
    totalTime: '30 mins',
    difficulty: 'Easy',
    author: 'Delisha Marie',
    ingredients: ['Ingredient 1', 'Ingredient 2'],
    instructions: ['Step 1', 'Step 2'],
    nutrition: {
      calories: '200',
      protein: '5g',
      fat: '10g',
      carbohydrates: '20g',
      saturatedFat: '2g',
      cholesterol: '10mg',
      sodium: '100mg',
      fiber: '2g',
      sugar: '10g',
      servingSize: '1 slice',
    },
    notes: ['Special note'],
    course: 'Main Course',
    cuisine: 'American',
    theBest: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeDetail],
      providers: [
        provideRouter([]),
        {
          provide: NgOptimizedImage,
          useValue: {}, // Mock NgOptimizedImage if needed, but it usually works with provideRouter
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeDetail);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render recipe details when recipe is provided', () => {
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Test Recipe');
    expect(compiled.querySelector('p')?.textContent).toContain('A delicious test recipe');
    expect(compiled.querySelectorAll('li').length).toBeGreaterThanOrEqual(2); // Ingredients
    expect(compiled.textContent).toContain('Step 1');
    expect(compiled.textContent).toContain('Step 2');
    expect(compiled.textContent).toContain('200'); // Calories
    expect(compiled.textContent).toContain('The Best');
  });

  it('should render "Recipe not found" when recipe is null', () => {
    fixture.componentRef.setInput('recipe', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Recipe not found');
  });

  it('should generate correct breadcrumbs', () => {
    fixture.componentRef.setInput('recipe', mockRecipe);
    const breadcrumbs = component.breadcrumbItems();

    expect(breadcrumbs.length).toBe(5); // Home > Recipes > Desserts > Cakes > Test Recipe
    expect(breadcrumbs[0].label).toBe('Home');
    expect(breadcrumbs[2].label).toBe('Desserts');
    expect(breadcrumbs[2].url).toBe('/recipes/desserts');
    expect(breadcrumbs[3].label).toBe('Cakes');
    expect(breadcrumbs[3].url).toBe('/recipes/desserts/cakes');
    expect(breadcrumbs[4].label).toBe('Test Recipe');
    expect(breadcrumbs[4].url).toBeUndefined();
  });

  it('should handle breadcrumbs with missing category/subcategory', () => {
    const minimalRecipe = { ...mockRecipe, category: '', subcategory: '' };
    fixture.componentRef.setInput('recipe', minimalRecipe);
    const breadcrumbs = component.breadcrumbItems();

    expect(breadcrumbs.length).toBe(3); // Home > Recipes > Test Recipe
    expect(breadcrumbs[0].label).toBe('Home');
    expect(breadcrumbs[1].label).toBe('Recipes');
    expect(breadcrumbs[2].label).toBe('Test Recipe');
  });

  it('should show serves from yields or servings', () => {
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      yield: '4 people',
      servings: undefined,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('4 people');

    fixture.componentRef.setInput('recipe', { ...mockRecipe, yield: undefined, servings: '6' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('6');
  });
});
