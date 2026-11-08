import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeService } from '../../services/recipe.service';
import { RecipeIndexService } from '../recipe-index/recipe-index.service';
import { AppConfigService } from '../../services/config.service';
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

  let configServiceMock: { KitchenHomeConfig: ReturnType<typeof vi.fn> };

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

    configServiceMock = {
      KitchenHomeConfig: vi.fn().mockReturnValue({
        featuredRecipes: ['/recipes/dinner', '/recipes/breakfast', '/recipes/lunch'],
        kitchen_about: 'custom_profile.png',
        sidebar_about: 'custom_sidebar.png',
      }),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: RecipeIndexService, useValue: recipeIndexServiceMock },
        { provide: AppConfigService, useValue: configServiceMock },
      ],
      imports: [Home],
    }).compileComponents();
  });

  it('should create and load configured featured recipes and categories', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.featuredCategories()).toEqual(mockFeaturedCategories);
    expect(component.featuredRecipes1()).toBe('/recipes/dinner');
    expect(component.featuredRecipes2()).toBe('/recipes/breakfast');
    expect(component.featuredRecipes3()).toBe('/recipes/lunch');
    expect(component.picture()).toBe('custom_profile.png');
  });

  it('should render all sections including 3 featured recipe blocks and top cover slot', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    const coverSlot = compiled.querySelector('#home-cover');
    expect(coverSlot).toBeTruthy();

    const categoryImages = compiled.querySelector('dm-category-images');
    expect(categoryImages).toBeTruthy();

    const latestRecipes = compiled.querySelector('dm-latest-recipes');
    expect(latestRecipes).toBeTruthy();

    const featuredRecipes = compiled.querySelectorAll('dm-featured-recipes');
    expect(featuredRecipes).toHaveLength(3);

    const authorBio = compiled.querySelector('dm-author-bio');
    expect(authorBio).toBeTruthy();

    const topRatedRecipes = compiled.querySelector('dm-top-rated-recipes');
    expect(topRatedRecipes).toBeTruthy();
  });

  it('should pass empty link strings to featured recipes when unconfigured', async () => {
    configServiceMock.KitchenHomeConfig.mockReturnValue({
      featuredRecipes: ['/recipes/dinner', '', ''],
      kitchen_about: 'delisha_marie_profile_2.png',
      sidebar_about: 'delisha_marie_profile.png',
    });

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.featuredRecipes1()).toBe('/recipes/dinner');
    expect(component.featuredRecipes2()).toBe('');
    expect(component.featuredRecipes3()).toBe('');

    const compiled = fixture.nativeElement as HTMLElement;
    const featuredRecipes = compiled.querySelectorAll('dm-featured-recipes');
    expect(featuredRecipes).toHaveLength(3);
  });

  it('should handle unconfigured or null KitchenHomeConfig gracefully', async () => {
    configServiceMock.KitchenHomeConfig.mockReturnValue(null);

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.featuredRecipes1()).toBe('');
    expect(component.featuredRecipes2()).toBe('');
    expect(component.featuredRecipes3()).toBe('');
    expect(component.picture()).toBe('delisha_marie_profile_2.png');

    const compiled = fixture.nativeElement as HTMLElement;
    const featuredRecipes = compiled.querySelectorAll('dm-featured-recipes');
    expect(featuredRecipes).toHaveLength(3);
  });
});
