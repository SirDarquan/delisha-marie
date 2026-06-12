import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RecipeIndex } from './recipe-index';
import { RecipeIndexService } from './recipe-index.service';

import { FullCategory } from '../../models/category';

describe('RecipeIndex', () => {
  let component: RecipeIndex;
  let fixture: ComponentFixture<RecipeIndex>;

  beforeEach(async () => {
    const mockCategories: FullCategory[] = [
      { name: 'Appetizers', image: 'test.png', url: '/test' },
      { name: 'Breakfast', image: 'test.png', url: '/test' },
      { name: 'Main Dishes', image: 'test.png', url: '/test' },
      { name: 'Sides', image: 'test.png', url: '/test' },
      { name: 'Salads', image: 'test.png', url: '/test' },
      { name: 'Soups', image: 'test.png', url: '/test' },
      { name: 'Breads', image: 'test.png', url: '/test' },
      { name: 'Desserts', image: 'test.png', url: '/test' },
    ];
    const mockMethods: FullCategory[] = [
      {
        name: 'Air Fryer',
        image: 'test.png',
        url: '/methods/air-fryer',
        children: [{ name: 'Chicken', url: '/methods/air-fryer/chicken' }],
      },
      { name: 'Baked', image: 'test.png', url: '/methods/baked' },
    ];

    const mockBestRecipes = [
      {
        name: 'The Best Air Fryer',
        url: '/the-best-recipes/the-best-air-fryer',
        children: [
          {
            name: 'The Best Chicken',
            url: '/the-best-recipes/the-best-air-fryer/the-best-chicken',
          },
        ],
      },
      { name: 'The Best Baked', url: '/the-best-recipes/the-best-baked' },
    ];

    await TestBed.configureTestingModule({
      imports: [RecipeIndex],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RecipeIndexService,
          useValue: {
            getData: () =>
              Promise.resolve({
                featuredCategories: mockCategories,
                cookingMethods: mockMethods,
                holidays: mockMethods,
                specialDiets: mockMethods,
                bestRecipes: mockBestRecipes,
                categoriesList: mockMethods,
                methodsList: mockMethods,
                ingredients: [],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Recipe Index title with Material classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.textContent).toContain('Recipe Index');
    expect(h1?.classList.contains('mat-headline-medium')).toBe(true);
  });

  it('should render the category images component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-recipe-index-category-images')).toBeTruthy();
  });

  it('should render the method images component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-recipe-index-method-images')).toBeTruthy();
  });

  it('should render other discovery sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#holidays-title')).toBeTruthy();
    expect(compiled.querySelector('#diets-title')).toBeTruthy();
    expect(compiled.querySelector('#best-recipes-title')).toBeTruthy();
  });

  it('should render the breadcrumbs with correct items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const breadcrumbs = compiled.querySelector('dml-breadcrumbs');
    expect(breadcrumbs).toBeTruthy();
    expect(breadcrumbs?.textContent).toContain('Home');
    expect(breadcrumbs?.textContent).toContain('Recipe Index');
  });

  it('should render the newsletter section with correct titles', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const newsletter = compiled.querySelector('footer');
    expect(newsletter).toBeTruthy();
    expect(newsletter?.querySelector('h2')?.textContent).toContain('Never miss a beat!');
    expect(newsletter?.querySelector('button')?.textContent).toContain(
      'Join the Studio Newsletter',
    );
  });

  it('should render section headers correctly via link list components', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#category-list-title')).toBeTruthy();
    expect(compiled.querySelector('#methods-list-title')).toBeTruthy();
  });

  it('should correctly transform categories into "The Best" recipes with recursive URLs', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const bestRecipes = component.bestRecipes();
    expect(bestRecipes[0].name).toBe('The Best Air Fryer');
    expect(bestRecipes[0].url).toBe('/the-best-recipes/the-best-air-fryer');

    // Verify recursion via public signal
    expect(bestRecipes[0].children?.[0].name).toBe('The Best Chicken');
    expect(bestRecipes[0].children?.[0].url).toBe(
      '/the-best-recipes/the-best-air-fryer/the-best-chicken',
    );
  }, 15000);
});
