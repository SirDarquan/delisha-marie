import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeaturedRecipes } from './featured-recipes';
import { RecipeService } from '../../services/recipe.service';
import { ComponentRef } from '@angular/core';
import { vi } from 'vitest';
import type { Mock } from 'vitest';

describe('FeaturedRecipes', () => {
  let component: FeaturedRecipes;
  let fixture: ComponentFixture<FeaturedRecipes>;
  let componentRef: ComponentRef<FeaturedRecipes>;
  let fakeRecipeService: {
    getRecipes: Mock;
  };

  const mockRecipes = [
    {
      id: 1,
      title: 'Recipe 1',
      slug: 'recipe-1',
      description: 'Desc 1',
      image: 'img1.jpg',
    },
    {
      id: 2,
      title: 'Recipe 2',
      slug: 'recipe-2',
      description: 'Desc 2',
      image: 'img2.jpg',
    },
  ];

  beforeEach(async () => {
    fakeRecipeService = {
      getRecipes: vi.fn().mockResolvedValue({ items: mockRecipes }),
    };

    await TestBed.configureTestingModule({
      imports: [FeaturedRecipes],
      providers: [provideRouter([]), { provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedRecipes);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    componentRef.setInput('link', '/recipes/dinner');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compute title from link category', () => {
    componentRef.setInput('link', '/recipes/dinner');
    fixture.detectChanges();
    expect(component.title()).toBe('Dinner');
  });

  it('should compute title from link subcategory if present', () => {
    componentRef.setInput('link', '/recipes/dinner/pasta');
    fixture.detectChanges();
    expect(component.title()).toBe('Pasta');
  });

  it('should render title', () => {
    componentRef.setInput('link', '/recipes/dinner');
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('h2');
    expect(header.textContent.trim()).toBe('Dinner');
  });

  it('should render special text when provided', () => {
    componentRef.setInput('link', '/recipes/dinner');
    componentRef.setInput('special', 'Featured');
    fixture.detectChanges();
    const specialHeader = fixture.nativeElement.querySelector('h5');
    expect(specialHeader.textContent.trim()).toBe('Featured');
  });

  it('should render "View All" link with correct href', () => {
    componentRef.setInput('link', '/recipes/dinner');
    fixture.detectChanges();
    const viewAllBtn = fixture.nativeElement.querySelector('.hidden.md\\:flex a');
    expect(viewAllBtn).toBeTruthy();
    expect(viewAllBtn.getAttribute('href')).toBe('/recipes/dinner');
    expect(viewAllBtn.textContent.trim()).toBe('View All');
  });

  it('should fetch recipes using RecipeService with correct parameters based on link', async () => {
    componentRef.setInput('link', '/recipes/dinner/pasta');
    fixture.detectChanges();
    await fixture.whenStable(); // Wait for resource to fetch
    fixture.detectChanges();

    expect(fakeRecipeService.getRecipes).toHaveBeenCalledWith(1, 4, 'recipes', 'dinner', 'pasta');
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('h3').textContent.trim()).toBe('Recipe 1');
    expect(cards[1].querySelector('h3').textContent.trim()).toBe('Recipe 2');
  });

  it('should fall back to "recipes" method if link has no valid segments', async () => {
    componentRef.setInput('link', '///'); // Lots of slashes to test .find(s => !!s) returning undefined
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The method should default to 'recipes'
    expect(fakeRecipeService.getRecipes).toHaveBeenCalledWith(1, 4, 'recipes', '', '');
  });

  it('should return empty array if recipeResource has no items', async () => {
    fakeRecipeService.getRecipes.mockResolvedValueOnce({ items: undefined });
    componentRef.setInput('link', '/recipes/lunch');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.recipes()).toEqual([]);
  });

  it('should return empty array if recipeResource value is undefined (loading)', async () => {
    // Return a promise that doesn't resolve immediately
    let resolvePromise: (value: { items: unknown[] }) => void = () => {};
    fakeRecipeService.getRecipes.mockReturnValueOnce(
      new Promise<{ items: unknown[] }>((res) => (resolvePromise = res)),
    );
    componentRef.setInput('link', '/recipes/breakfast');
    fixture.detectChanges();

    // While loading, the value is undefined, so it should return []
    expect(component.recipes()).toEqual([]);
    resolvePromise({ items: [] }); // Cleanup
  });
});
