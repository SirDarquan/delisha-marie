import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WINDOW } from '../../services/global-tokens';
import { Recipe } from '../../services/recipe.service';
import { createMockRecipe } from '../../utils/test-recipe';
import { SidebarQuickView } from './sidebar-quick-view';
import { By } from '@angular/platform-browser';

describe('SidebarQuickView', () => {
  let component: SidebarQuickView;
  let fixture: ComponentFixture<SidebarQuickView>;
  let mockWindow: {
    document: {
      getElementById: ReturnType<typeof vi.fn>;
    };
  };

  const mockRecipe: Recipe = createMockRecipe({
    id: '1',
    title: 'Quick Test Recipe',
    slug: 'quick-test-recipe',
    description: 'Quick description',
    image: 'test.jpg',
    prepTime: '5 min',
    cookTime: '10 min',
    difficulty: 'Easy',
    totalTime: '15 min',
    author: 'Delisha Marie',
    category: 'Test',
  });

  beforeEach(async () => {
    mockWindow = {
      document: {
        getElementById: vi.fn(),
      },
    };

    await TestBed.configureTestingModule({
      imports: [SidebarQuickView, NgOptimizedImage],
      providers: [
        { provide: WINDOW, useValue: mockWindow },
        {
          provide: IMAGE_LOADER,
          useValue: (config: ImageLoaderConfig) => config.src,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarQuickView);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display recipe details', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toContain(mockRecipe.title);
    expect(compiled.textContent).toContain(mockRecipe.prepTime);
    expect(compiled.textContent).toContain(mockRecipe.cookTime);
    expect(compiled.textContent).toContain(mockRecipe.difficulty);
  });

  it('should scroll to recipe card on button click', () => {
    const mockElement = { scrollIntoView: vi.fn() };
    mockWindow.document.getElementById.mockReturnValue(mockElement);

    component.scrollToElement('recipe-card');

    expect(mockWindow.document.getElementById).toHaveBeenCalledWith('recipe-card');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('should not throw error if recipe-card element is not found', () => {
    mockWindow.document.getElementById.mockReturnValue(null);
    expect(() => component.scrollToElement('recipe-card')).not.toThrow();
  });

  it('should trigger scrollToElement on button click', () => {
    const mockElement = { scrollIntoView: vi.fn() };
    mockWindow.document.getElementById.mockReturnValue(mockElement);

    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(mockWindow.document.getElementById).toHaveBeenCalledWith('recipe-card');
  });
});
