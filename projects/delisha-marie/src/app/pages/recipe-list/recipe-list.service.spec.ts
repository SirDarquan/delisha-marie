import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { RecipeListService } from './recipe-list.service';

describe('RecipeListService', () => {
  let service: RecipeListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecipeListService],
    });
    service = TestBed.inject(RecipeListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTitle', () => {
    it('should return capitalized title from URL when no category/subcategory', () => {
      const title = service.getTitle({ url: 'the-best-recipes' });
      expect(title).toBe('The Best Recipes');
    });

    it('should return capitalized category when category is provided', () => {
      const title = service.getTitle({ url: 'recipes', category: 'dinner' });
      expect(title).toBe('Dinner');
    });

    it('should return subcategory followed by category when both are provided', () => {
      const title = service.getTitle({
        url: 'recipes',
        category: 'dinner',
        subCategory: 'chicken',
      });
      expect(title).toBe('Chicken Dinner');
    });

    it('should append page number when page > 1', () => {
      const title = service.getTitle({ url: 'recipes', category: 'dinner', page: '2' });
      expect(title).toBe('Dinner - Page 2');
    });

    it('should not append page number when page is 1', () => {
      const title = service.getTitle({ url: 'recipes', category: 'dinner', page: '1' });
      expect(title).toBe('Dinner');
    });

    it('should handle hyphenated categories correctly', () => {
      const title = service.getTitle({ url: 'recipes', category: 'slow-cooker' });
      expect(title).toBe('Slow Cooker');
    });

    it('should return subcategory alone when category is not provided', () => {
      const title = service.getTitle({
        url: 'recipes',
        subCategory: 'chicken',
      });
      expect(title).toBe('Chicken');
    });

    it('should return "Recipe List" as fallback', () => {
      const title = service.getTitle({ url: '' });
      expect(title).toBe('Recipe List');
    });
  });

  describe('getInfo', () => {
    it('should return correct SEO metadata', () => {
      const info = service.getInfo({ url: 'recipes', category: 'dinner' });
      expect(info.title).toBe("Dinner | Delisha Marie's Kitchen");
      expect(info.description).toContain('delicious dinner recipes');
      expect(info.image).toContain('unsplash.com');
      expect(info.imageWidth).toBe('800');
    });
  });
});
