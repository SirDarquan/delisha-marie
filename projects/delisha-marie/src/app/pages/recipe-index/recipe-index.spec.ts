import {
  ComponentFixture,
  TestBed,
  DeferBlockBehavior,
  DeferBlockState,
} from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RecipeIndex } from './recipe-index';
import { RecipeIndexService } from './recipe-index.service';

import { FullCategory, RecipeIndexResponse } from '../../models/category';

describe('RecipeIndex', () => {
  let component: RecipeIndex;
  let fixture: ComponentFixture<RecipeIndex>;
  const mockIsLoadingSignal = signal<boolean>(false);
  const mockDataSignal = signal<RecipeIndexResponse | null>(null);

  beforeEach(async () => {
    mockIsLoadingSignal.set(false);
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
      { name: 'The Best Baked', url: '/the-best-baked' },
    ];

    const mockData = {
      featuredCategories: mockCategories,
      cookingMethods: mockMethods,
      holidays: mockMethods,
      specialDiets: mockMethods,
      bestRecipes: mockBestRecipes,
      categoriesList: mockMethods,
      methodsList: mockMethods,
      ingredients: [],
    };

    mockDataSignal.set(mockData);

    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
      imports: [RecipeIndex],
      providers: [
        provideRouter([]),
        {
          provide: RecipeIndexService,
          useValue: {
            getData: () => Promise.resolve(mockData),
            indexResource: {
              value: mockDataSignal,
              isLoading: mockIsLoadingSignal,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Recipe Index title with Material classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.textContent).toContain('Recipe Index');
    expect(h1?.classList.contains('mat-headline-small')).toBe(true);
  });

  it('should render the category images component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-recipe-index-category-images')).toBeTruthy();
  });

  it('should render the method images component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-recipe-index-method-images')).toBeTruthy();
  });

  it('should render other discovery sections', async () => {
    const deferBlocks = await fixture.getDeferBlocks();
    for (const block of deferBlocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
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

  it('should render section headers correctly via link list components', async () => {
    const deferBlocks = await fixture.getDeferBlocks();
    for (const block of deferBlocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#category-list-title')).toBeTruthy();
    expect(compiled.querySelector('#methods-list-title')).toBeTruthy();
  });

  it('should correctly transform categories into "The Best" recipes with recursive URLs', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const bestRecipes = component.bestRecipes();

    expect(bestRecipes.length).toBe(2);
    expect(bestRecipes[0].name).toBe('The Best Air Fryer');
    expect(bestRecipes[0].url).toBe('/the-best-recipes/the-best-air-fryer');
    expect(bestRecipes[0].children?.[0].name).toBe('The Best Chicken');
    expect(bestRecipes[0].children?.[0].url).toBe(
      '/the-best-recipes/the-best-air-fryer/the-best-chicken',
    );
  });

  it('should correctly handle categories with no children for "The Best"', () => {
    const bestRecipes = component.bestRecipes();
    expect(bestRecipes[1].name).toBe('The Best Baked');
    expect(bestRecipes[1].url).toBe('/the-best-baked');
    expect(bestRecipes[1].children).toBeUndefined();
  });

  it('should render skeleton loader when isLoading is true', () => {
    mockIsLoadingSignal.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should handle undefined data gracefully with fallback empty arrays', () => {
    mockIsLoadingSignal.set(true);
    mockDataSignal.set(undefined as unknown as RecipeIndexResponse);
    fixture.detectChanges();
    expect(component.featuredCategories()).toEqual([]);
    expect(component.featuredMethods()).toEqual([]);
    expect(component.categoriesList()).toEqual([]);
    expect(component.methodsList()).toEqual([]);
    expect(component.holidays()).toEqual([]);
    expect(component.specialDiets()).toEqual([]);
    expect(component.ingredients()).toEqual([]);
    expect(component.bestRecipes()).toEqual([]);
  });

  it('should handle empty object data gracefully with fallback empty arrays', () => {
    mockDataSignal.set({} as RecipeIndexResponse);
    fixture.detectChanges();

    expect(component.featuredCategories()).toEqual([]);
    expect(component.featuredMethods()).toEqual([]);
    expect(component.categoriesList()).toEqual([]);
    expect(component.methodsList()).toEqual([]);
    expect(component.holidays()).toEqual([]);
    expect(component.specialDiets()).toEqual([]);
    expect(component.ingredients()).toEqual([]);
    expect(component.bestRecipes()).toEqual([]);
  });
});
