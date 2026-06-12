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
    });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    expect(component.tagGroups()).toEqual([]);
  });

  it('should handle undefined breadcrumbs', () => {
    const mockRecipe: Recipe = createMockRecipe({
      breadcrumbs: undefined as unknown as Recipe['breadcrumbs'],
    });
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      breadcrumbs: { items: undefined as unknown as Recipe['breadcrumbs']['items'] },
    } as unknown as Recipe);
    fixture.detectChanges();

    expect(component.tagGroups()).toEqual([]);
  });

  it('should extract correct tags and filter Home and Recipe title', () => {
    const mockRecipe: Recipe = createMockRecipe({
      title: 'Banana Bread',
      breadcrumbs: {
        main: 0,
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Breads', url: '/recipes/breads' },
            { label: 'Banana Bread' },
          ],
        ],
      },
    });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const tags = component.tagGroups();
    expect(tags.length).toBe(1);
    expect(tags[0].items.length).toBe(2);
    expect(tags[0].items[0].label).toBe('Recipes');
    expect(tags[0].items[1].label).toBe('Breads');

    const compiled = fixture.nativeElement as HTMLElement;
    const tagLinks = compiled.querySelectorAll('.tag-link');
    expect(tagLinks.length).toBe(2);
    expect(tagLinks[0].textContent).toContain('Recipes');
    expect(tagLinks[1].textContent).toContain('Breads');
  });
});
