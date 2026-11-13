import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Recipe } from '../../services/recipe.service';
import { RecipeCard } from './recipe-card';

describe('RecipeCard Component', () => {
  let component: RecipeCard;
  let fixture: ComponentFixture<RecipeCard>;

  const mockRecipe: Recipe = {
    id: 1,
    title: 'Delicious Lemon Tart',
    slug: 'delicious-lemon-tart',
    description: 'A zesty and buttery classic lemon tart.',
    image: '/images/lemon-tart.webp',
    status: 'published',
    location: '/the-best-recipes/the-best-dessert',
    locationName: 'Desserts',
    rating: 4.8,
    reviewCount: 24,
  } as unknown as Recipe;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', mockRecipe);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render individual-links variant correctly', () => {
    fixture.componentRef.setInput('variant', 'individual-links');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const matCard = compiled.querySelector('mat-card');
    expect(matCard).toBeTruthy();

    const locationLink = compiled.querySelector('a[href*="/the-best-recipes"]');
    expect(locationLink?.textContent?.trim()).toBe('Desserts');

    const titleLink = compiled.querySelector('mat-card-content h3');
    expect(titleLink?.textContent?.trim()).toBe('Delicious Lemon Tart');

    const desc = compiled.querySelector('p');
    expect(desc?.textContent).toContain('A zesty and buttery classic lemon tart.');

    const img = compiled.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Delicious Lemon Tart');
  });

  it('should render card-link variant correctly', () => {
    fixture.componentRef.setInput('variant', 'card-link');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rootLink = compiled.querySelector('a[href*="/recipe/delicious-lemon-tart"]');
    expect(rootLink).toBeTruthy();

    const locationTag = compiled.querySelector('mat-card-content span');
    expect(locationTag).toBeNull();

    const title = compiled.querySelector('h3');
    expect(title?.textContent?.trim()).toBe('Delicious Lemon Tart');
  });

  it('should render ranked-stars variant with rank badge and rating', () => {
    fixture.componentRef.setInput('variant', 'ranked-stars');
    fixture.componentRef.setInput('rank', 1);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rankEl = compiled.querySelector('.text-\\[64px\\]');
    expect(rankEl?.textContent?.trim()).toBe('#1');

    const starsEl = compiled.querySelector('dml-stars');
    expect(starsEl).toBeTruthy();
    expect(compiled.textContent).toContain('4.8 stars');
    expect(compiled.textContent).toContain('(24 comments)');
  });

  it('should render destination-link variant with action button', () => {
    fixture.componentRef.setInput('variant', 'destination-link');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('mat-card-actions button');
    expect(button?.textContent?.trim()).toBe('Read Full Recipe');
  });

  it('should apply image priority correctly when priority input is true', () => {
    fixture.componentRef.setInput('variant', 'card-link');
    fixture.componentRef.setInput('priority', true);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
  });
});
