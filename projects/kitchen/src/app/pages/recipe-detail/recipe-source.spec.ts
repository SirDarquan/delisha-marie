import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Recipe } from '../../services/recipe.service';
import { createMockRecipe } from '../../utils/test-recipe';
import { RecipeSource } from './recipe-source';

describe('RecipeSource', () => {
  let component: RecipeSource;
  let fixture: ComponentFixture<RecipeSource>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeSource],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeSource);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    const mockRecipe = createMockRecipe();
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return null if source is not present', () => {
    const mockRecipe: Recipe = createMockRecipe({ source: undefined });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    expect(component.sanitizedSource()).toBeNull();
  });

  it('should sanitize and render plain text source', () => {
    const mockRecipe: Recipe = createMockRecipe({ source: 'My Grandma' });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Recipe Source:');
    expect(compiled.querySelector('.source-content')?.textContent).toContain('My Grandma');
  });

  it('should inject target="_blank" and rel="noopener noreferrer" into links', () => {
    const mockRecipe: Recipe = createMockRecipe({
      source: '<a href="https://example.com" class="link">Example</a>',
    });
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const anchor = compiled.querySelector('a');
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
    expect(anchor?.getAttribute('class')).toBe('link');
    expect(anchor?.textContent).toBe('Example');
  });
});
