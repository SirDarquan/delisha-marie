import { TestBed } from '@angular/core/testing';
import { Home } from './home';
import { RecipeService } from '../../services/recipe.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

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
    expect(compiled.querySelectorAll('mat-card').length).toBe(mockRecipes.length);
    expect(compiled.querySelector('h3')?.textContent).toContain('Chicken Tikka');
  });
});
