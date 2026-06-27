import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Recipe } from '../../services/recipe.service';
import { createMockRecipe } from '../../utils/test-recipe';
import { RecipeTags } from './recipe-tags';

describe('RecipeTags', () => {
  let component: RecipeTags;
  let fixture: ComponentFixture<RecipeTags>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeTags],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeTags);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    const mockRecipe = createMockRecipe();
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should handle missing items in breadcrumbs', () => {
    const mockRecipe: Recipe = createMockRecipe({
      breadcrumbs: {
        main: undefined,
        items: [],
      },
      method: '',
    });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    expect(component.allTags()).toEqual([]);
  });

  it('should extract correct tags from breadcrumbs and filter Home and Recipe title', () => {
    const mockRecipe: Recipe = createMockRecipe({
      title: 'Banana Bread',
      breadcrumbs: {
        main: 0,
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Breads', url: '/recipes/breads' },
            { label: 'Banana Bread', url: '/recipe/banana-bread' },
          ],
        ],
      },
      method: '',
    });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const tags = component.allTags();
    expect(tags).toHaveLength(2);
    expect(tags[0].label).toBe('Recipes');
    expect(tags[1].label).toBe('Breads');

    const compiled = fixture.nativeElement as HTMLElement;
    const tagLinks = compiled.querySelectorAll('.tag-link');
    expect(tagLinks).toHaveLength(2);
    expect(tagLinks[0].textContent).toContain('Recipes');
    expect(tagLinks[1].textContent).toContain('Breads');
  });

  it('should extract method, holidays, and special diets and slugify them', () => {
    const mockRecipe: Recipe = createMockRecipe({
      title: 'Special Cake',
      breadcrumbs: { main: 0, items: [] },
      method: 'Baking',
      holidays: ['Christmas', 'New Year'],
      specialDiets: ['Gluten Free'],
    });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const tags = component.allTags();
    expect(tags).toHaveLength(4);
    expect(tags[0].label).toBe('Baking');
    expect(tags[0].url).toBe('/methods/baking');
    expect(tags[1].label).toBe('Christmas');
    expect(tags[1].url).toBe('/holidays/christmas');
    expect(tags[2].label).toBe('New Year');
    expect(tags[2].url).toBe('/holidays/new-year');
    expect(tags[3].label).toBe('Gluten Free');
    expect(tags[3].url).toBe('/special-diets/gluten-free');
  });

  it('should remove duplicate tags', () => {
    const mockRecipe: Recipe = createMockRecipe({
      title: 'Test',
      breadcrumbs: {
        main: 0,
        items: [
          [
            { label: 'Recipes', url: '/recipes' },
            { label: 'Baking', url: '/recipes/baking' },
          ],
        ],
      },
      method: 'Baking',
    });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const tags = component.allTags();
    // 'Baking' is in breadcrumbs and method, but should only appear once
    expect(tags).toHaveLength(2);
    expect(tags[0].label).toBe('Recipes');
    expect(tags[1].label).toBe('Baking');
  });
});
