import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { deslugify } from '@dm/library';
import { Recipe, RecipeService } from '../services/recipe.service';
import { PagesService } from '../services/pages.service';

export interface SchemaObject {
  '@context'?: string;
  '@type'?: string;
  '@id'?: string;
  [key: string]:
    string | number | boolean | undefined | null | SchemaObject | (string | SchemaObject)[];
}

export interface Breadcrumb {
  label: string;
  url?: string;
}

export const schemaResolver: ResolveFn<SchemaObject[]> = (route, state) => {
  const document = inject(DOCUMENT);
  const schema: SchemaObject[] = [];
  const origin = document.location.origin;
  const path = state.url.split('?')[0].split('#')[0];
  const url = origin + path;

  const siteName = 'Delisha Marie';
  const description = route.data['description'];
  const slug = route.paramMap.get('slug') || '';

  schema.push(
    generateOrganizationSchema(
      origin,
      siteName,
      `${origin}/assets/delisha-marie.jpg`,
      '1024',
      '1024',
    ),
    generateWebSiteSchema(origin, siteName),
  );

  if (
    state.url.includes('/recipes') ||
    state.url.includes('/method') ||
    state.url.includes('/holidays') ||
    state.url.includes('/special-diets') ||
    state.url.includes('/tag') ||
    state.url.includes('/the-best-recipe')
  ) {
    schema.push(generateCollectionPageSchema(origin, siteName, description));
  } else {
    schema.push(generateWebPageSchema(url, slug, siteName, description, '', ''));
  }

  const breadcrumbs = getBaseBreadcrumbs(path);
  schema.push(generateBreadcrumbSchema(breadcrumbs, origin, path));

  const schemaObj = {
    '@context': 'https://schema.org',
    '@graph': schema,
  };

  let script = document.querySelector('script#dynamic-schema');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('id', 'dynamic-schema');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObj);

  return schema;
};

export const schemaDynamicPageResolver: ResolveFn<SchemaObject[]> = async (route, state) => {
  const document = inject(DOCUMENT);
  const schema: SchemaObject[] = [];
  const origin = document.location.origin;
  const path = state.url.split('?')[0].split('#')[0];
  const url = origin + path;

  const siteName = 'Delisha Marie';
  const description = route.data['description'];
  const slug = route.paramMap.get('slug') || '';

  schema.push(
    generateOrganizationSchema(
      origin,
      siteName,
      `${origin}/assets/delisha-marie.jpg`,
      '1024',
      '1024',
    ),
    generateWebSiteSchema(origin, siteName),
  );

  if (slug === '') {
    schema.push(generateWebPageSchema(url, slug, siteName, description, '', ''));
  } else if (slug === 'about') {
    schema.push(generateAboutPageSchema(url, siteName, description));
  } else if (slug === 'contact') {
    schema.push(generateContactPageSchema(url, siteName, description));
  } else if (slug === 'faq') {
    const pageService = inject(PagesService);
    const page = await pageService.getPage('faq');
    if (!page) return schema;
    const parsedFaqs: { question: string; answer: string }[] = [];
    const regex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
    let match;
    while ((match = regex.exec(page.content)) !== null) {
      const question = match[1].replace(/<[^>]*>/g, '').trim();
      const answer = match[2]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (question && answer) {
        parsedFaqs.push({ question, answer });
      }
    }
    if (parsedFaqs.length > 0) {
      schema.push(generateFAQPageSchema(url, siteName, parsedFaqs));
    }
  }

  const breadcrumbs = getBaseBreadcrumbs(path);
  schema.push(generateBreadcrumbSchema(breadcrumbs, origin, path));

  const schemaObj = {
    '@context': 'https://schema.org',
    '@graph': schema,
  };

  let script = document.querySelector('script#dynamic-schema');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('id', 'dynamic-schema');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObj);

  return schema;
};

export const schemaRecipeResolver: ResolveFn<SchemaObject[]> = async (route) => {
  const document = inject(DOCUMENT);
  const siteName = 'Delisha Marie';
  const slug = route.paramMap.get('slug');

  if (!slug) return [];

  const recipe = await inject(RecipeService).getRecipeBySlug(slug);

  if (!recipe) return [];

  const schema: SchemaObject[] = [];
  const origin = document.location.origin.replace(/\/$/, '');
  const logoUrl = `${origin}/assets/delisha-marie.jpg`;
  const recipeUrl = `${origin}${recipe.slug}`;

  schema.push(
    // 1. Organization
    generateOrganizationSchema(origin, siteName, logoUrl, '800px', '800px'),

    // 2. Person (Author)
    generatePersonSchema(origin, recipe.author),

    // 3. WebSite
    generateWebSiteSchema(origin, siteName),

    // 4. ImageObject (Recipe Image)
    generateImageObjectSchema(recipeUrl, recipe.slug, recipe.image, recipe.title),

    // 5. WebPage
    generateWebPageSchema(recipeUrl, recipe.slug, recipe.title, recipe.description, '', ''),

    // 6. Article
    generateArticleSchema(recipe, recipeUrl, recipe.image, recipe.keywords || [], [
      recipe.course || 'Recipe',
    ]),

    // 7. Recipe
    generateRecipeSchema(recipe, recipeUrl),

    // 8. Breadcrumbs
    generateBreadcrumbSchema(getRecipeBreadcrumbs(recipe), origin, recipe.slug),
  );

  const schemaObj = {
    '@context': 'https://schema.org',
    '@graph': schema,
  };

  let script = document.querySelector('script#dynamic-schema');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('id', 'dynamic-schema');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObj);

  return schema;
};

/**
 * Generate an Organization schema object.
 */
export const generateOrganizationSchema = (
  url: string,
  name: string,
  logoUrl: string,
  oWidth: string,
  oHeight: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name: name,
    url: url,
    logo: {
      '@type': 'ImageObject',
      '@id': `${url}#/schema/logo/image`,
      url: logoUrl,
      contentUrl: logoUrl,
      width: oWidth,
      height: oHeight,
      caption: name,
      inLanguage: 'en-US',
    },
    image: {
      '@id': `${url}#/schema/logo/image`,
    },
    sameAs: [
      'https://www.facebook.com/delisha-marie/',
      'https://x.com/delisha-marie',
      'https://www.instagram.com/delishamarie_/',
    ],
  };
};

/**
 * Generate a WebSite schema object.
 */
export const generateWebSiteSchema = (url: string, siteName: string): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: siteName,
    url: url,
    description: '',
    publisher: {
      '@id': `${url}#organization`,
    },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${url}?s={search_term_string}`,
        },
        'query-input': {
          '@type': 'PropertyValueSpecification',
          valueRequired: true,
          valueName: 'search_term_string',
        },
      },
    ],
    inLanguage: 'en-US',
  };
};

/**
 * Generate a CollectionPage schema object.
 */
export const generateCollectionPageSchema = (
  url: string,
  name: string,
  description: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}`,
    url: url,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${url.split('/').slice(0, 3).join('/')}/#website`,
    },
    about: {
      '@id': `${url}#organization`,
    },
    breadcrumb: {
      '@id': `${url}#breadcrumb`,
    },
    inLanguage: 'en-US',
  };
};

/**
 * Generate an AboutPage schema object.
 */
export const generateAboutPageSchema = (
  url: string,
  name: string,
  description: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${url}#webpage`,
    url: url,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${url.split('/').slice(0, 3).join('/')}/#website`,
    },
    breadcrumb: {
      '@id': `${url}#breadcrumb`,
    },
    inLanguage: 'en-US',
  };
};

/**
 * Generate a ContactPage schema object.
 */
export const generateContactPageSchema = (
  url: string,
  name: string,
  description: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${url}#webpage`,
    url: url,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${url.split('/').slice(0, 3).join('/')}/#website`,
    },
    breadcrumb: {
      '@id': `${url}#breadcrumb`,
    },
    inLanguage: 'en-US',
  };
};

/**
 * Generate an FAQPage schema object.
 */
export const generateFAQPageSchema = (
  url: string,
  name: string,
  mainEntity: { question: string; answer: string }[],
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#webpage`,
    url: url,
    name: name,
    mainEntity: mainEntity.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    isPartOf: {
      '@id': `${url.split('/').slice(0, 3).join('/')}/#website`,
    },
    breadcrumb: {
      '@id': `${url}#breadcrumb`,
    },
    inLanguage: 'en-US',
  };
};

/**
 * Generate a WebPage schema object.
 */
export const generateWebPageSchema = (
  url: string,
  slug: string,
  name: string,
  description: string,
  thumbnailUrl: string,
  datePublished: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url: url,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${url.split('/').slice(0, 3).join('/')}/#website`,
    },
    primaryImageOfPage: {
      '@id': `${url}#primaryimage`,
    },
    image: {
      '@id': `${url}#primaryimage`,
    },
    thumbnailUrl: `${url}${thumbnailUrl}`,
    datePublished: datePublished,
    breadcrumb: {
      '@id': `${url}#breadcrumb`,
    },
    inLanguage: 'en-US',
    potentialAction: [
      {
        '@type': 'ReadAction',
        target: [`${url}`],
      },
    ],
  };
};

export const generateBreadcrumbSchema = (
  breadcrumbs: Breadcrumb[],
  baseUrl: string,
  slug: string,
): SchemaObject => {
  const items = breadcrumbs;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${baseUrl}${slug}#breadcrumb`,
    itemListElement: items.map((b, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: b.label,
      item: b.url ? `${baseUrl}/${b.url.replace(/^\//, '')}` : undefined,
    })),
  };
};

/**
 * Generates a standardized list of breadcrumbs based on the user's specific order:
 * Home -> Recipes -> Category -> [Subcategory] -> Recipe
 * Also dynamically generates supplemental trails (main: false) for The Best, Method, Diets, and Holidays.
 */
export const getRecipeBreadcrumbs = (recipe: Recipe): Breadcrumb[] => {
  const idx = recipe.breadcrumbs?.main;
  return typeof idx === 'number' && recipe.breadcrumbs?.items ? recipe.breadcrumbs.items[idx] : [];
};

/**
 * Generate a Person schema object.
 */
export const generatePersonSchema = (url: string, name: string): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#/schema/person/`,
    name: name,
    // image: image ? {
    //     '@type': 'ImageObject',
    //     '@id': `${url}#personimage`,
    //     url: image,
    //     contentUrl: image,
    //     caption: name,
    //     inLanguage: 'en-US'
    // } : undefined,
    sameAs: [url],
  };
};

/**
 * Generate an ImageObject schema object.
 */
export const generateImageObjectSchema = (
  url: string,
  slug: string,
  imageUrl: string,
  caption?: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${url}#primaryimage`,
    url: imageUrl, // todo
    contentUrl: imageUrl,
    caption: caption,
    inLanguage: 'en-US',
  };
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
  const baseUrl = url.split('/').slice(0, 3).join('/');
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
    wordCount: 0,
    commentCount: 0,
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
    thumbnailUrl: `${url}${thumbnailUrl}`, // Todo
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
export const generateRecipeSchema = (recipe: Recipe, url: string): SchemaObject => {
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
    image: [recipe.image], // todo
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
      ratingValue: recipe.rating || 5,
      ratingCount: recipe.ratingCount,
      reviewCount: recipe.reviewCount || 1,
    },
    review: recipe.comments?.slice(0, 6).map((comment) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: comment.author,
      },
      reviewBody: comment.content,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: comment.rating,
      },
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

const convertToIso8601Duration = (duration: string): string => {
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
/**
 * Generates breadcrumbs for list pages or other static pages.
 */
const getBaseBreadcrumbs = (currentCrumbs?: string): Breadcrumb[] => {
  const items: Breadcrumb[] = [];

  // 1. Home
  items.push({ label: 'Home', url: '/' });

  if (!currentCrumbs) {
    return items;
  }

  const crumbs = currentCrumbs
    .split('/page/')[0]
    .split('/')
    .filter((c) => c !== '')
    .reduce((acc, crumb) => {
      items.push({ label: deslugify(crumb), url: `${acc}/${crumb}` });
      return `${acc}/${crumb}`;
    }, '');

  if (crumbs !== currentCrumbs) {
    deslugify(currentCrumbs);
  }
  return items;
};
