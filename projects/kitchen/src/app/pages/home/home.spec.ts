import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RecipeService } from '../../services/recipe.service';
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

  beforeEach(async () => {
    TestBed.resetTestingModule();
    const recipeServiceMock = {
      recipes: signal(mockRecipes),
      categories: signal(['Dinner']),
      getRecipes: vi.fn().mockResolvedValue({ items: mockRecipes, total: 1 }),
    };

    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: RecipeService, useValue: recipeServiceMock }],
      imports: [Home],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Home);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the recipe grid', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const featuredRecipes = compiled.querySelector('dm-featured-recipes');
    expect(featuredRecipes).toBeTruthy();

    const topRatedRecipes = compiled.querySelector('dm-top-rated-recipes');
    expect(topRatedRecipes).toBeTruthy();
  });
});
