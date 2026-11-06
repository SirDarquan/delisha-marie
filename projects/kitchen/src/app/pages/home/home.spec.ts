import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeService } from '../../services/recipe.service';
import { RecipeIndexService } from '../recipe-index/recipe-index.service';
import { PagesService } from '../../services/pages.service';
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

  let pagesServiceMock: { getPage: ReturnType<typeof vi.fn> };

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

    pagesServiceMock = {
      getPage: vi.fn().mockResolvedValue({
        id: '1',
        slug: 'kitchen:home',
        title: 'Kitchen Home',
        content: JSON.stringify({
          featuredRecipes: ['/recipes/dinner', '/recipes/breakfast', '/recipes/lunch'],
          picture: 'custom_profile.png',
        }),
        updated_at: '2026-11-06T10:00:00Z',
      }),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: RecipeIndexService, useValue: recipeIndexServiceMock },
        { provide: PagesService, useValue: pagesServiceMock },
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

    // Check top cover container slot
    const coverSlot = compiled.querySelector('#home-cover');
    expect(coverSlot).toBeTruthy();

    const categoryImages = compiled.querySelector('dm-category-images');
    expect(categoryImages).toBeTruthy();

    const latestRecipes = compiled.querySelector('dm-latest-recipes');
    expect(latestRecipes).toBeTruthy();

    const featuredRecipes = compiled.querySelectorAll('dm-featured-recipes');
    expect(featuredRecipes.length).toBe(3);

    const authorBio = compiled.querySelector('dm-author-bio');
    expect(authorBio).toBeTruthy();

    const topRatedRecipes = compiled.querySelector('dm-top-rated-recipes');
    expect(topRatedRecipes).toBeTruthy();
  });

  it('should not render featured recipes when links are empty strings', async () => {
    pagesServiceMock.getPage.mockResolvedValueOnce({
      id: '1',
      slug: 'kitchen:home',
      title: 'Kitchen Home',
      content: JSON.stringify({
        featuredRecipes: ['/recipes/dinner', '', ''],
      }),
      updated_at: '2026-11-06T10:00:00Z',
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
    expect(featuredRecipes.length).toBe(1);
  });

  it('should handle unconfigured or invalid JSON gracefully', async () => {
    pagesServiceMock.getPage.mockResolvedValueOnce({
      id: '1',
      slug: 'kitchen:home',
      title: 'Kitchen Home',
      content: 'invalid json content',
      updated_at: '2026-11-06T10:00:00Z',
    });

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
    expect(featuredRecipes.length).toBe(0);
  });

  it('should handle null page from pagesService', async () => {
    pagesServiceMock.getPage.mockResolvedValueOnce(null);

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.featuredRecipes1()).toBe('');
    expect(component.picture()).toBe('delisha_marie_profile_2.png');
  });
});
