import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { TopRatedRecipes } from './top-rated-recipes';
import { RecipeService } from '../../services/recipe.service';
import type { Recipe } from '../../services/recipe.service';

describe('TopRatedRecipes', () => {
  let component: TopRatedRecipes;
  let fixture: ComponentFixture<TopRatedRecipes>;
  let mockRecipeService: { getRecipes: Mock };

  function createMockRecipe(id: string, title: string, ratingCount: number): Recipe {
    return {
      id,
      title,
      slug: `recipe-${id}`,
      description: `Desc ${id}`,
      image: `/image${id}.jpg`,
      status: 'published',
      ratingCount,
      rating: ratingCount,
      reviewCount: 10,
      breadcrumbs: { main: 0, items: [] },
      nutrition: {},
      comments: [],
      cuisine: '',
      course: '',
      method: '',
      navigation: { prev: null, next: null },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as Recipe;
  }

  const mockRecipes: Recipe[] = [
    createMockRecipe('1', 'Recipe 1', 4.8),
    createMockRecipe('2', 'Recipe 2 (Low Rating)', 4.0), // will be filtered out
    createMockRecipe('3', 'Recipe 3', 4.9),
    createMockRecipe('4', 'Recipe 4', 4.7),
    createMockRecipe('5', 'Recipe 5', 4.6),
    createMockRecipe('6', 'Recipe 6', 4.8), // 5th high rating, will be sliced out
  ];

  beforeEach(async () => {
    mockRecipeService = {
      getRecipes: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TopRatedRecipes],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RecipeService, useValue: mockRecipeService },
      ],
    }).compileComponents();
  });

  it('should create and filter recipes by rating > 4.5, limiting to 4, and render them', async () => {
    mockRecipeService.getRecipes.mockResolvedValue({ items: mockRecipes, total: 6 });

    fixture = TestBed.createComponent(TopRatedRecipes);
    component = fixture.componentInstance;

    // Initial change detection triggers the resource
    fixture.detectChanges();

    // Wait for the resource promise to resolve
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.recipes()).toHaveLength(4);
    expect(component.recipes()[0].title).toBe('Recipe 1');
    expect(component.recipes()[1].title).toBe('Recipe 3');
    expect(component.recipes()[2].title).toBe('Recipe 4');
    expect(component.recipes()[3].title).toBe('Recipe 5');

    // Verify template rendering
    const cards = fixture.debugElement.queryAll(By.css('mat-card'));
    expect(cards).toHaveLength(4);

    const firstRank = fixture.debugElement
      .query(By.css('.text-\\[64px\\]'))
      .nativeElement.textContent.trim();
    expect(firstRank).toBe('#1');
  });

  it('should handle empty result gracefully and render nothing if < 4 recipes', async () => {
    mockRecipeService.getRecipes.mockResolvedValue({ items: [], total: 0 });

    fixture = TestBed.createComponent(TopRatedRecipes);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.recipes()).toHaveLength(0);
    const cards = fixture.debugElement.queryAll(By.css('mat-card'));
    expect(cards).toHaveLength(0);
  });

  it('should handle undefined items in response', async () => {
    // Provide a promise that resolves to an object missing items, mimicking a potential malformed response
    mockRecipeService.getRecipes.mockResolvedValue(
      {} as unknown as { items: Recipe[]; total: number },
    );

    fixture = TestBed.createComponent(TopRatedRecipes);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.recipes()).toHaveLength(0);
  });
});
