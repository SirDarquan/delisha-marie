/**
 * Utility functions for slugification and URL-friendly name transformations.
 */

/**
 * Converts a string to a URL-friendly slug.
 * Example: "Valentine's Day" -> "valentines-day"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replaceAll("'s", 's') // Handle possessives: Valentine's -> valentines
    .replaceAll(/[^a-z0-9 -]/g, '') // Remove special characters
    .replaceAll(/\s+/g, '-') // Replace spaces with -
    .replaceAll(/-+/g, '-'); // Remove duplicate hyphens
}

/**
 * Best-effort reversal of a slug to a display name.
 * Example: "independence-day" -> "Independence Day"
 */
export function deslugify(slug: string): string {
  return slug
    .split('-')
    .map((word) => {
      // Special cases for common words that shouldn't be capitalized
      const lowercaseWords = ['and', 'or', 'the', 'of', 'in', 'with', 'for'];
      if (lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^([a-z])/, (match) => match.toUpperCase()); // Always capitalize first word
}

/**
 * Strategy for Holiday and Category URLs:
 * 1. Base path: /holiday/ or /recipes/ or /methods/
 * 2. Slug: generated from the name
 * 3. Result: lowercase, kebab-case
 */
export function generateUrl(basePath: string, name: string): string {
  const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${cleanBase}${slugify(name)}`;
}
