import { describe, it, expect } from 'vitest';
import { slugify, deslugify, generateUrl } from './slug';

describe('Slug Utility', () => {
  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('IndependenceDay')).toBe('independenceday');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('Independence Day')).toBe('independence-day');
    });

    it('should handle possessives (remove apostrophe but keep s)', () => {
      expect(slugify("Valentine's Day")).toBe('valentines-day');
    });

    it('should remove special characters', () => {
      expect(slugify("St. Patrick's Day!")).toBe('st-patricks-day');
    });

    it('should trim and handle multiple spaces/hyphens', () => {
      expect(slugify('  Hello   World  ')).toBe('hello-world');
      expect(slugify('Hello--World')).toBe('hello-world');
    });
  });

  describe('deslugify', () => {
    it('should convert hyphens back to spaces and title case', () => {
      expect(deslugify('independence-day')).toBe('Independence Day');
    });

    it('should keep common small words lowercase (except first)', () => {
      expect(deslugify('the-best-of-times')).toBe('The Best of Times');
    });

    it('should handle single words', () => {
      expect(deslugify('soup')).toBe('Soup');
    });
  });

  describe('generateUrl', () => {
    it('should combine base path and slug', () => {
      expect(generateUrl('/holiday', 'Independence Day')).toBe('/holiday/independence-day');
    });

    it('should handle trailing slashes in base path', () => {
      expect(generateUrl('/holiday/', 'Independence Day')).toBe('/holiday/independence-day');
    });
  });
});
