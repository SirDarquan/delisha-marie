import { parseIngredientName, capitalizeIngredient } from './ingredient-parser';

describe('ingredient-parser', () => {
  describe('parseIngredientName', () => {
    it('should return null for null, undefined, or empty strings', () => {
      expect(parseIngredientName(null)).toBeNull();
      expect(parseIngredientName(undefined)).toBeNull();
      expect(parseIngredientName('')).toBeNull();
      expect(parseIngredientName('   ')).toBeNull();
    });

    it('should parse 1 pound of catfish to catfish', () => {
      expect(parseIngredientName('1 pound of catfish')).toBe('catfish');
    });

    it('should parse 1 cup of ginger to ginger', () => {
      expect(parseIngredientName('1 cup of ginger')).toBe('ginger');
    });

    it('should handle fractional quantities and units', () => {
      expect(parseIngredientName('1/2 cup olive oil')).toBe('olive oil');
      expect(parseIngredientName('2.5 tablespoons soy sauce')).toBe('soy sauce');
      expect(parseIngredientName('½ teaspoon cayenne pepper')).toBe('cayenne pepper');
    });

    it('should strip parenthetical annotations', () => {
      expect(parseIngredientName('1 can (15 oz) black beans')).toBe('black beans');
    });

    it('should strip comma-separated preparation instructions', () => {
      expect(parseIngredientName('3 cloves garlic, minced')).toBe('garlic');
      expect(parseIngredientName('1 medium yellow onion, diced')).toBe('yellow onion');
    });

    it('should strip leading and trailing prep terms', () => {
      expect(parseIngredientName('fresh basil leaves')).toBe('basil');
      expect(parseIngredientName('sea salt to taste')).toBe('sea salt');
    });

    it('should strip sizes and leftover of prefix', () => {
      expect(parseIngredientName('2 large eggs')).toBe('eggs');
      expect(parseIngredientName('of catfish')).toBe('catfish');
    });

    it('should handle raw ingredient without quantities', () => {
      expect(parseIngredientName('catfish')).toBe('catfish');
      expect(parseIngredientName('Ginger')).toBe('ginger');
    });

    it('should return null if string reduces to empty', () => {
      expect(parseIngredientName('1 cup of')).toBeNull();
      expect(parseIngredientName('---')).toBeNull();
    });
  });

  describe('capitalizeIngredient', () => {
    it('should capitalize single words', () => {
      expect(capitalizeIngredient('catfish')).toBe('Catfish');
    });

    it('should title case multiple words', () => {
      expect(capitalizeIngredient('olive oil')).toBe('Olive Oil');
      expect(capitalizeIngredient('black beans')).toBe('Black Beans');
    });

    it('should handle empty input', () => {
      expect(capitalizeIngredient('')).toBe('');
    });
  });
});
