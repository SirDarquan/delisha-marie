import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { BaseRecipe } from '../types/recipe';
import { RecipeGrid } from './recipe-grid';

describe('RecipeGrid Component', () => {
  let component: RecipeGrid;
  let fixture: ComponentFixture<RecipeGrid>;

  const mockRecipes: BaseRecipe[] = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `Recipe ${i + 1}`,
    slug: `recipe-${i + 1}`,
    description: `Description ${i + 1}`,
    image: `/images/recipe-${i + 1}.webp`,
    status: 'published',
    location: '/recipes/dinner',
    locationName: 'Dinner',
    rating: 4.5,
    reviewCount: 10,
    ingredients: [],
    instructions: [],
    prepTime: '10m',
    cookTime: '20m',
    totalTime: '30m',
    difficulty: 'Easy',
    yield: '4 servings',
    author: 'Delisha Marie',
    content: '',
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeGrid],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeGrid);
    component = fixture.componentInstance;
  });

  it('should render the correct responsive column classes for 2, 3, and 4 columns', () => {
    // Default 4 columns
    expect(component.gridClass()).toContain('lg:grid-cols-4');

    // 3 columns
    fixture.componentRef.setInput('columns', 3);
    expect(component.gridClass()).toContain('lg:grid-cols-3');

    // 2 columns
    fixture.componentRef.setInput('columns', 2);
    expect(component.gridClass()).toContain('md:grid-cols-2');
  });

  it('should display loading skeletons when isLoading is true and recipes is empty', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.componentRef.setInput('recipes', []);
    fixture.componentRef.setInput('pageSize', 6);
    fixture.detectChanges();

    const skeletons = fixture.debugElement.queryAll(By.css('.animate-pulse'));
    expect(skeletons).toHaveLength(6);
  });

  it('should render recipe cards when recipes are provided', () => {
    fixture.componentRef.setInput('recipes', mockRecipes);
    fixture.componentRef.setInput('pageSize', 6);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('dml-recipe-card'));
    expect(cards).toHaveLength(6);
  });

  it('should render empty state message when recipes list is empty and not loading', () => {
    fixture.componentRef.setInput('recipes', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('emptyMessage', 'Custom empty message');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Custom empty message');
  });
});
