import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Recipe, RecipeService } from '../../services/recipe.service';
import { LatestRecipes } from './latest-recipes';

describe('LatestRecipes Component', () => {
  let component: LatestRecipes;
  let fixture: ComponentFixture<LatestRecipes>;
  let router: Router;

  const mockRecipes: Recipe[] = [
    {
      id: 1,
      title: 'Delicious Apple Pie',
      slug: 'delicious-apple-pie',
      description: 'Crisp and buttery homemade pie with fresh apples.',
      image: 'apple-pie.jpg',
      status: 'published',
      location: '/the-best-recipes/the-best-dessert/the-best-pies',
      locationName: 'The Best Pies',
    } as unknown as Recipe,
    {
      id: 2,
      title: 'Creamy Garlic Pasta',
      slug: 'creamy-garlic-pasta',
      description: 'Rich garlic pasta tossed with parmesan and fresh herbs.',
      image: 'garlic-pasta.jpg',
      status: 'published',
      location: '/recipes/dinner/pasta',
      locationName: 'Pasta',
    } as unknown as Recipe,
  ];

  let getRecipesMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getRecipesMock = vi.fn().mockResolvedValue({ items: mockRecipes, total: 12 });

    await TestBed.configureTestingModule({
      imports: [LatestRecipes],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: { getRecipes: getRecipesMock } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LatestRecipes);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(vi.fn());
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render section title when showSectionTitle is true', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('h2');
    expect(titleEl?.textContent).toContain('Latest Recipes');
  });

  it('should hide section title when showSectionTitle input is false', async () => {
    fixture.componentRef.setInput('showSectionTitle', false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('h2');
    expect(titleEl).toBeNull();
  });

  it('should render recipe cards with location badge, title, image, and description', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(cards.length).toBe(2);

    const firstCard = cards[0];
    const locationBadge = firstCard.querySelector('a[href*="/the-best-recipes"]');
    expect(locationBadge?.textContent?.trim()).toBe('The Best Pies');

    const titleEl = firstCard.querySelector('mat-card-content h3');
    expect(titleEl?.textContent?.trim()).toContain('Delicious Apple Pie');

    const descEl = firstCard.querySelector('p');
    expect(descEl?.textContent).toContain('Crisp and buttery homemade pie');

    const img = firstCard.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Delicious Apple Pie');
  });

  it('should navigate to "/" when page 1 is selected in pagination', () => {
    component.onPageChange(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should navigate to "/page/:page" when page > 1 is selected in pagination', () => {
    component.onPageChange(2);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/page/2');
  });

  it('should render empty state message when recipes list is empty', async () => {
    getRecipesMock.mockResolvedValue({ items: [], total: 0 });
    fixture = TestBed.createComponent(LatestRecipes);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No recipes found at this time');
  });

  it('should handle service errors gracefully by returning empty list', async () => {
    getRecipesMock.mockRejectedValue(new Error('Network failure'));
    fixture = TestBed.createComponent(LatestRecipes);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.recipes()).toEqual([]);
  });

  it('should fetch recipes during server-side rendering', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LatestRecipes],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: { getRecipes: getRecipesMock } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();

    const serverFixture = TestBed.createComponent(LatestRecipes);
    serverFixture.detectChanges();
    await serverFixture.whenStable();

    expect(serverFixture.componentInstance.recipes()).toEqual(mockRecipes);
    expect(getRecipesMock).toHaveBeenCalledWith(1, 6, 'recipes');
  });
});
