import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeDetail } from './recipe-detail';
import { Recipe, RecipeService } from '../../services/recipe.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockRecipe } from '../../utils/test-recipe';

describe('RecipeDetail', () => {
  let component: RecipeDetail;
  let fixture: ComponentFixture<RecipeDetail>;
  let recipeServiceMock: {
    recipes: ReturnType<typeof signal<Recipe[]>>;
    getComments: ReturnType<typeof vi.fn>;
  };

  const mockRecipe: Recipe = createMockRecipe({
    id: '1',
    title: 'Test Recipe',
    slug: 'test-recipe',
    description: 'A delicious test recipe',
    image: 'test.jpg',
    category: 'Desserts',
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
    content: '<p>A delicious test recipe story.</p>',
  });

  const mockRecipes: Recipe[] = [
    createMockRecipe({ ...mockRecipe, id: '0', slug: 'prev-recipe', title: 'Prev Recipe' }),
    mockRecipe,
    createMockRecipe({ ...mockRecipe, id: '2', slug: 'next-recipe', title: 'Next Recipe' }),
  ];

  beforeEach(async () => {
    recipeServiceMock = {
      recipes: signal(mockRecipes),
      getComments: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeDetail],
      providers: [provideRouter([]), { provide: RecipeService, useValue: recipeServiceMock }],
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
    expect(compiled.querySelector('dml-recipe-hero')).toBeTruthy();
    expect(compiled.querySelector('dml-recipe-meta')).toBeTruthy();
    expect(compiled.querySelector('.recipe-story')).toBeTruthy();
    expect(compiled.querySelector('dml-recipe-card')).toBeTruthy();
    expect(compiled.querySelector('dml-recipe-navigation')).toBeTruthy();
    expect(compiled.querySelector('dml-recipe-comments')).toBeTruthy();
  }, 30000);

  it('should render "Recipe not found" when recipe is null', () => {
    fixture.componentRef.setInput('recipe', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Recipe not found');
  });

  it('should generate correct breadcrumbs with all levels', () => {
    fixture.componentRef.setInput('recipe', mockRecipe);
    const breadcrumbs = component.breadcrumbItems();

    expect(breadcrumbs.length).toBe(5); // Home > Recipes > Desserts > Cakes > Test Recipe
    expect(breadcrumbs[0].label).toBe('Home');
    expect(breadcrumbs[2].label).toBe('Desserts');
    expect(breadcrumbs[3].label).toBe('Cakes');
    expect(breadcrumbs[4].label).toBe('Test Recipe');
  });

  it('should handle breadcrumbs without subcategory', () => {
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      breadcrumbs: {
        main: 0,
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Desserts', url: '/recipes/desserts' },
            { label: 'Test Recipe' },
          ],
        ],
      },
    });
    const breadcrumbs = component.breadcrumbItems();

    expect(breadcrumbs.length).toBe(4); // Home > Recipes > Desserts > Test Recipe
    expect(breadcrumbs[2].label).toBe('Desserts');
    expect(breadcrumbs[3].label).toBe('Test Recipe');
  });

  it('should handle breadcrumbs without category', () => {
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      breadcrumbs: {
        main: 0,
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Test Recipe' },
          ],
        ],
      },
    });
    const breadcrumbs = component.breadcrumbItems();

    expect(breadcrumbs.length).toBe(3); // Home > Recipes > Test Recipe
    expect(breadcrumbs[1].label).toBe('Recipes');
    expect(breadcrumbs[2].label).toBe('Test Recipe');
  });

  it('should handle breadcrumbs with undefined content', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, content: undefined });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-story')?.innerHTML).toBe('');
  });

  it('should return empty array if breadcrumb main index is undefined', () => {
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      breadcrumbs: {
        main: undefined as unknown as number,
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
          ],
        ],
      },
    });
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs.length).toBe(0);
  });

  it('should return empty array if recipe is null', () => {
    fixture.componentRef.setInput('recipe', null);
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs.length).toBe(0);
  });
});
