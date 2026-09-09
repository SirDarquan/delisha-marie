/**
 * List of common culinary units of measurement.
 */
const UNITS = [
  'cup',
  'cups',
  'c',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'tbsps',
  'tbs',
  'teaspoon',
  'teaspoons',
  'tsp',
  'tsps',
  'pound',
  'pounds',
  'lb',
  'lbs',
  'ounce',
  'ounces',
  'oz',
  'gram',
  'grams',
  'g',
  'kilogram',
  'kilograms',
  'kg',
  'milliliter',
  'milliliters',
  'ml',
  'liter',
  'liters',
  'l',
  'fluid ounce',
  'fluid ounces',
  'fl oz',
  'pint',
  'pints',
  'pt',
  'quart',
  'quarts',
  'qt',
  'gallon',
  'gallons',
  'gal',
  'pinch',
  'pinches',
  'dash',
  'dashes',
  'piece',
  'pieces',
  'slice',
  'slices',
  'clove',
  'cloves',
  'package',
  'packages',
  'pkg',
  'pkgs',
  'can',
  'cans',
  'jar',
  'jars',
  'head',
  'heads',
  'stalk',
  'stalks',
  'stick',
  'sticks',
  'bunch',
  'bunches',
  'sprig',
  'sprigs',
  'drop',
  'drops',
  'leaf',
  'leaves',
  'bottle',
  'bottles',
  'bag',
  'bags',
];

const PREP_TERMS = [
  'freshly ground',
  'fresh',
  'ground',
  'dried',
  'raw',
  'cooked',
  'warm',
  'cold',
  'hot',
  'chilled',
  'frozen',
  'melted',
  'softened',
  'chopped',
  'minced',
  'diced',
  'sliced',
  'peeled',
  'grated',
  'shredded',
  'crushed',
  'to taste',
  'for garnish',
  'beaten',
  'divided',
  'halved',
  'quartered',
  'leaves',
  'leaf',
];

const SIZE_TERMS = ['extra large', 'small', 'medium', 'large', 'jumbo', 'huge', 'tiny', 'whole'];

/**
 * Extracts the core ingredient name from a raw recipe ingredient string.
 * Example: "1 pound of catfish" -> "catfish"
 * Example: "1 cup of ginger" -> "ginger"
 */
export function parseIngredientName(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  // 1. Remove text in parentheses (e.g., "(15 oz)")
  let text = raw.replace(/\([^)]*\)/g, ' ');

  // 2. Discard everything after comma, semicolon, or dash
  text = text.split(/,| - | – |;/)[0] || '';

  // 3. Lowercase and trim
  text = text.toLowerCase().trim();

  // 4. Remove leading quantities, fractions, numbers (without unneeded escape characters)
  text = text.replace(/^[0-9.\-/½¼¾⅓⅔⅛⅜⅝⅞\s]+/g, '').trim();

  // 5. Remove units of measurement (with optional "of")
  const unitRegex = new RegExp(String.raw`^(${UNITS.join('|')})\b(?:\s+of)?(?:\s+|$)`, 'i');
  text = text.replace(unitRegex, '').trim();

  // 6. Remove leading size modifiers (e.g. "large eggs" -> "eggs")
  const sizeRegex = new RegExp(String.raw`^(${SIZE_TERMS.join('|')})\b\s+`, 'i');
  text = text.replace(sizeRegex, '').trim();

  // 7. Remove common prep descriptors from start and end
  for (let i = 0; i < 2; i++) {
    for (const prep of PREP_TERMS) {
      if (text.endsWith(' ' + prep)) {
        text = text.slice(0, -(prep.length + 1)).trim();
      }
      if (text.startsWith(prep + ' ')) {
        text = text.slice(prep.length + 1).trim();
      }
    }
  }

  // 8. Clean leftover "of " prefix and excess whitespace
  text = text
    .replace(/^of\b\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > 0 ? text : null;
}

/**
 * Capitalizes each word in an ingredient name for display and storage.
 * Example: "catfish" -> "Catfish", "olive oil" -> "Olive Oil"
 */
export function capitalizeIngredient(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
