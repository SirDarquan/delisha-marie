import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Recipe, RecipeService } from '../../services/recipe.service';
import { createMockRecipe } from '../../utils/test-recipe';
import { RecipeMeta } from './recipe-meta';

describe('RecipeMeta', () => {
  let component: RecipeMeta;
  let fixture: ComponentFixture<RecipeMeta>;
  let recipeServiceMock: {
    getComments: ReturnType<typeof vi.fn>;
  };

  const mockRecipe: Recipe = createMockRecipe({
    id: '123',
    title: 'Test Recipe',
    slug: 'test-recipe',
    description: 'A test recipe',
    image: 'test.jpg',
    author: 'Delisha Marie',
    prepTime: '10 min',
    cookTime: '20 min',
    totalTime: '30 min',
    difficulty: 'Easy',
    category: 'Breakfast',
    createdAt: '2026-01-01T10:00:00Z',
  });

  beforeEach(async () => {
    recipeServiceMock = {
      getComments: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeMeta],
      providers: [provideRouter([]), { provide: RecipeService, useValue: recipeServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeMeta);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Published" date if updatedAt is missing', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, updatedAt: '' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const dateText = compiled.querySelector('.recipe-meta')?.textContent;
    expect(dateText).toContain('Published: Jan 1, 2026');
  });

  it('should display "Updated" date if updatedAt is present', () => {
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      updatedAt: '2026-02-01T10:00:00Z',
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const dateText = compiled.querySelector('.recipe-meta')?.textContent;
    expect(dateText).toContain('Updated: Feb 1, 2026');
  });

  it('should display the correct author', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-meta')?.textContent).toContain('Author: Delisha Marie');
  });

  it('should display "0 Comment(s)" initially', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-meta')?.textContent).toContain('0 Comment(s)');
  });

  it('should update comment count when resource resolves', async () => {
    recipeServiceMock.getComments.mockResolvedValue([{ id: '1' }, { id: '2' }]);

    // Trigger resource re-fetch by updating the input (even with same ID to be safe or just wait)
    fixture.componentRef.setInput('recipe', { ...mockRecipe, id: '123-new' });
    fixture.detectChanges();

    // Wait for resource
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-meta')?.textContent).toContain('2 Comment(s)');
  });

  it('should have correct navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');

    // Jump to Recipe
    const jumpLink = Array.from(links).find((a) => a.textContent?.includes('Jump to Recipe'));
    expect(jumpLink?.getAttribute('href')).toBe('/#recipe-card');

    // Comment Count
    const commentLink = Array.from(links).find((a) => a.textContent?.includes('Comment(s)'));
    expect(commentLink?.getAttribute('href')).toBe('/#comments');

    // Author
    const authorLink = Array.from(links).find((a) => a.textContent?.includes('Author'));
    expect(authorLink?.getAttribute('href')).toBe('/about');
  });

  it('should fall back to "Delisha Marie" if author is empty', () => {
    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      author: '',
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-meta')?.textContent).toContain('Author: Delisha Marie');
  });

  it('should fall back to current ISO date if both updatedAt and createdAt are missing', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1)); // June 1, 2026

    fixture.componentRef.setInput('recipe', {
      ...mockRecipe,
      createdAt: '',
      updatedAt: '',
    });
    fixture.detectChanges();
    // It should render the fallback date, which is today's date formatted (June 1, 2026)
    const compiled = fixture.nativeElement as HTMLElement;
    const dateText = compiled.querySelector('.recipe-meta')?.textContent;
    expect(dateText).toContain('Published: Jun 1, 2026');

    vi.useRealTimers();
  });
});
