import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Recipe, RecipeService } from '../../services/recipe.service';
import { createMockRecipe } from '../../utils/test-recipe';
import { RecipeMeta } from './recipe-meta';

describe('RecipeMeta', () => {
  let component: RecipeMeta;
  let fixture: ComponentFixture<RecipeMeta>;
  let recipeServiceMock: {
    getComments: ReturnType<typeof vi.fn>;
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

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
      getComments: vi.fn().mockResolvedValue({ comments: [], total: 0 }),
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

  it('should display the correct comment count', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, reviewCount: 0 });
    fixture.detectChanges();
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-meta')?.textContent).toContain('0 Comment(s)');

    fixture.componentRef.setInput('recipe', { ...mockRecipe, reviewCount: 42 });
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-meta')?.textContent).toContain('42 Comment(s)');
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

  describe('scrollToRecipeCard', () => {
    it('should scroll smoothly to target element when found', () => {
      vi.useFakeTimers();
      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = vi.fn().mockReturnValue({ top: 400 } as DOMRect);

      const doc = TestBed.inject(DOCUMENT);
      const getElementSpy = vi.spyOn(doc, 'getElementById').mockReturnValue(mockElement);
      const scrollToSpy = vi.fn();
      const origDefaultView = doc.defaultView;
      Object.defineProperty(doc, 'defaultView', {
        value: { scrollY: 100, scrollTo: scrollToSpy },
        configurable: true,
      });

      component.scrollToRecipeCard(mockEvent, 'recipe-card');
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(doc.getElementById).toHaveBeenCalledWith('recipe-card');
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 400 + 100 - 120, behavior: 'smooth' });

      Object.defineProperty(doc, 'defaultView', { value: origDefaultView, configurable: true });
      getElementSpy.mockRestore();
    });

    it('should handle zero/undefined scrollY or null defaultView when scrolling', () => {
      vi.useFakeTimers();
      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = vi.fn().mockReturnValue({ top: 300 } as DOMRect);

      const doc = TestBed.inject(DOCUMENT);
      const getElementSpy = vi.spyOn(doc, 'getElementById').mockReturnValue(mockElement);
      const scrollToSpy = vi.fn();
      const origDefaultView = doc.defaultView;
      Object.defineProperty(doc, 'defaultView', {
        value: { scrollY: undefined, scrollTo: scrollToSpy },
        configurable: true,
      });

      component.scrollToRecipeCard(mockEvent, 'comments');
      vi.advanceTimersByTime(50);
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 300 + 0 - 120, behavior: 'smooth' });

      // When defaultView is null
      Object.defineProperty(doc, 'defaultView', { value: null, configurable: true });
      component.scrollToRecipeCard(mockEvent, 'comments');
      expect(() => vi.advanceTimersByTime(50)).not.toThrow();

      Object.defineProperty(doc, 'defaultView', { value: origDefaultView, configurable: true });
      getElementSpy.mockRestore();
    });

    it('should do nothing if target element does not exist', () => {
      vi.useFakeTimers();
      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      const doc = TestBed.inject(DOCUMENT);
      const getElementSpy = vi.spyOn(doc, 'getElementById').mockReturnValue(null);
      const scrollToSpy = vi.fn();
      const origDefaultView = doc.defaultView;
      Object.defineProperty(doc, 'defaultView', {
        value: { scrollY: 0, scrollTo: scrollToSpy },
        configurable: true,
      });

      component.scrollToRecipeCard(mockEvent, 'non-existent');
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(scrollToSpy).not.toHaveBeenCalled();

      Object.defineProperty(doc, 'defaultView', { value: origDefaultView, configurable: true });
      getElementSpy.mockRestore();
    });

    it('should trigger scrollToRecipeCard when clicking "Jump to Recipe" and "Comment(s)"', () => {
      const scrollSpy = vi.spyOn(component, 'scrollToRecipeCard');
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a');

      const jumpLink = Array.from(links).find((a) => a.textContent?.includes('Jump to Recipe'));
      jumpLink?.dispatchEvent(new MouseEvent('click'));
      expect(scrollSpy).toHaveBeenCalledWith(expect.any(MouseEvent), 'recipe-card');

      const commentLink = Array.from(links).find((a) => a.textContent?.includes('Comment(s)'));
      commentLink?.dispatchEvent(new MouseEvent('click'));
      expect(scrollSpy).toHaveBeenCalledWith(expect.any(MouseEvent), 'comments');
    });
  });
});
