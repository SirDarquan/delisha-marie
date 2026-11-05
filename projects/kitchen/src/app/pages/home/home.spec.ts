import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeService } from '../../services/recipe.service';
import { RecipeIndexService } from '../recipe-index/recipe-index.service';
import { Home } from './home';

describe('Home', () => {
  const mockRecipes = [
    {
      id: 1,
      title: 'Chicken Tikka',
      description: 'Curry',
      cookTime: '30m',
      category: 'Dinner',
      rating: 5,
      difficulty: 'Medium',
      image: '/img.png',
    },
  ];

  const mockFeaturedCategories = [
    { name: 'Appetizers', image: '/app.png', url: '/recipes/appetizers' },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    const recipeServiceMock = {
      recipes: signal(mockRecipes),
      categories: signal(['Dinner']),
      getRecipes: vi.fn().mockResolvedValue({ items: mockRecipes, total: 1 }),
    };

    const recipeIndexServiceMock = {
      indexResource: {
        value: signal({ featuredCategories: mockFeaturedCategories }),
        isLoading: signal(false),
      },
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: RecipeIndexService, useValue: recipeIndexServiceMock },
      ],
      imports: [Home],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Home);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.featuredCategories()).toEqual(mockFeaturedCategories);
  });

  it('should render the recipe grid and category images', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const categoryImages = compiled.querySelector('dm-category-images');
    expect(categoryImages).toBeTruthy();

    const featuredRecipes = compiled.querySelector('dm-featured-recipes');
    expect(featuredRecipes).toBeTruthy();

    const latestRecipes = compiled.querySelector('dm-latest-recipes');
    expect(latestRecipes).toBeTruthy();

    const topRatedRecipes = compiled.querySelector('dm-top-rated-recipes');
    expect(topRatedRecipes).toBeTruthy();
  });
});
