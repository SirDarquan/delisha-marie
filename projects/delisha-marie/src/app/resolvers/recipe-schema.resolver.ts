import { DOCUMENT, IMAGE_LOADER, PathLocationStrategy } from '@angular/common';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Recipe, RecipeService } from '../services/recipe.service';
import {
  Breadcrumb,
  generateBreadcrumbSchema,
  generateImageObjectSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateWebPageSchema,
  generateWebSiteSchema,
  SchemaObject,
  stripHtml,
  writeSchema,
} from './schema.resolver';

export const schemaRecipeResolver: ResolveFn<SchemaObject[]> = async (route, state) => {
  const document = inject(DOCUMENT);
  const locationStrategy = inject(PathLocationStrategy);
  const loader = inject(IMAGE_LOADER);

  const siteName = 'Delisha Marie';
  const slug = route.paramMap.get('slug');

  if (!slug) return [];
  const recipeService = inject(RecipeService);
  const recipe = await recipeService.getSchemaBySlug(slug);

  if (!recipe) return [];
  if (!recipe.comments || recipe.comments.length === 0) {
    recipe.comments = await recipeService.getTopComments(slug);
  }

  const schema: SchemaObject[] = [];
  const baseHref =
    locationStrategy.getBaseHref() === '/' ? '' : locationStrategy.getBaseHref().replace(/\/$/, '');
  const origin = document.location.origin.replace(/\/$/, '') + baseHref;
  const path = state.url.split('?')[0].split('#')[0];
  const url = `${origin}${path}`;
  const logoUrl = loader({
    src: '/delisha-marie-profile.jpg',
    width: 800,
  });
  const imageUrl = loader({
    src: recipe.image,
    width: 300,
  });

  schema.push(
    // 1. Organization
    generateOrganizationSchema(origin, siteName, logoUrl, '800px', '800px'),

    // 2. Person (Author)
    generatePersonSchema(origin, recipe.author),

    // 3. WebSite
    generateWebSiteSchema(origin, siteName),

    // 4. ImageObject (Recipe Image)
    generateImageObjectSchema(url, imageUrl, recipe.title),

    // 5. WebPage
    generateWebPageSchema(url, recipe.slug, recipe.title, recipe.description, '', ''),

    // 6. Article
    generateArticleSchema(recipe, url, imageUrl, recipe.keywords || [], [
      recipe.course || 'Recipe',
    ]),

    // 7. Recipe
    generateRecipeSchema(recipe, url, imageUrl),

    // 8. Breadcrumbs
    generateBreadcrumbSchema(getRecipeBreadcrumbs(recipe), origin, url),
  );

  writeSchema(document, schema);

  return schema;
};

/**
 * Generates a standardized list of breadcrumbs based on the user's specific order:
 * Home -> Recipes -> Category -> [Subcategory] -> Recipe
 */
export const getRecipeBreadcrumbs = (recipe: Recipe): Breadcrumb[] => {
  const idx = recipe.breadcrumbs?.main;
  return typeof idx === 'number' && recipe.breadcrumbs?.items ? recipe.breadcrumbs.items[idx] : [];
};

/**
 * Generate an Article schema object.
 */
export const generateArticleSchema = (
  recipe: Recipe,
  url: string,
  thumbnailUrl: string,
  keywords: string[],
  articleSection: string[],
): SchemaObject => {
  const baseUrl = url.split('/').slice(0, -2).join('/');
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    isPartOf: {
      '@id': url,
    },
    author: {
      name: 'Delisha Marie',
      '@id': `${baseUrl}/#/schema/person/`,
    },
    headline: recipe.title,
    datePublished: recipe.createdAt,
    dateModified: recipe.updatedAt,
    wordCount: stripHtml(recipe.content)
      .split(/\s+/)
      .filter((w) => w.length > 0).length, // Count the words
    commentCount: recipe.reviewCount, // Count the comments
    mainEntityOfPage: {
      '@id': `${url}#webpage`,
    },
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    image: {
      '@id': `${url}#primaryimage`,
    },
    description: recipe.description,
    thumbnailUrl: `${thumbnailUrl}`,
    keywords: keywords,
    articleSection: articleSection,
    inLanguage: 'en-US',
    potentialAction: [
      {
        '@type': 'CommentAction',
        name: 'Comment',
        target: [`${url}#respond`],
      },
    ],
  };
};

/**
 * Generate a Recipe schema object.
 */
export const generateRecipeSchema = (
  recipe: Recipe,
  url: string,
  imageUrl: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    '@id': `${url}#recipe`,
    name: recipe.title,
    author: {
      '@type': 'Person',
      '@id': `${url.split('/').slice(0, 3).join('/')}/#/schema/person/`,
    },
    datePublished: recipe.createdAt,
    dateModified: recipe.updatedAt,
    description: recipe.description,
    image: [imageUrl],
    ...(recipe.video
      ? {
          video: {
            '@type': 'VideoObject',
            name: recipe.title,
            description: recipe.description,
            thumbnailUrl: recipe.image,
            contentUrl: `https://www.youtube.com/embed/${recipe.video}`,
            uploadDate: recipe.createdAt,
          },
        }
      : {}),
    recipeYield: recipe.yield,
    prepTime: convertToIso8601Duration(recipe.prepTime),
    cookTime: convertToIso8601Duration(recipe.cookTime),
    totalTime: convertToIso8601Duration(recipe.totalTime),
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions?.map((step) => ({
      '@type': 'HowToStep',
      text: step,
      url: `${url}`,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: recipe.rating || 0,
      ratingCount: recipe.ratingCount,
      reviewCount: recipe.reviewCount || 0,
    },
    review: recipe.comments?.slice(0, 6).map((comment) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: comment.author,
      },
      reviewBody: comment.content,
      reviewRating: comment.rating
        ? {
            '@type': 'Rating',
            ratingValue: comment.rating,
          }
        : undefined,
      datePublished: comment.createdAt,
    })),
    recipeCategory: recipe.course,
    recipeCuisine: recipe.cuisine,
    nutrition: {
      '@type': 'NutritionInformation',
      calories: recipe.nutrition?.calories,
      carbohydrateContent: recipe.nutrition?.carbohydrates,
      proteinContent: recipe.nutrition?.protein,
      fatContent: recipe.nutrition?.fat,
      saturatedFatContent: recipe.nutrition?.saturatedFat,
      cholesterolContent: recipe.nutrition?.cholesterol,
      sodiumContent: recipe.nutrition?.sodium,
      fiberContent: recipe.nutrition?.fiber,
      sugarContent: recipe.nutrition?.sugar,
      servingSize: recipe.nutrition?.servingSize,
    },
    mainEntityOfPage: url,
    isPartOf: {
      '@id': `${url}#article`,
    },
  };
};

export const convertToIso8601Duration = (duration: string): string => {
  if (!duration) return '';
  const lower = duration.toLowerCase();

  let totalMinutes = 0;
  let found = false;

  const daysMatch = /\b(\d{1,10})[ \t]*days?\b/.exec(lower);
  if (daysMatch) {
    totalMinutes += Number.parseInt(daysMatch[1], 10) * 24 * 60;
    found = true;
  }

  const hoursMatch = /\b(\d{1,10})[ \t]*(?:hours?|hrs|hr|h)\b/.exec(lower);
  if (hoursMatch) {
    totalMinutes += Number.parseInt(hoursMatch[1], 10) * 60;
    found = true;
  }

  const minsMatch = /\b(\d{1,10})[ \t]*(?:mins?|min)\b/.exec(lower);
  if (minsMatch) {
    totalMinutes += Number.parseInt(minsMatch[1], 10);
    found = true;
  }

  if (found) {
    return `PT${totalMinutes}M`;
  }

  return '';
};
