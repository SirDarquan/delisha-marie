import { APP_BASE_HREF, DOCUMENT, IMAGE_LOADER } from '@angular/common';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { deslugify } from '@dm/library';
import { PagesService } from '../services/pages.service';
import { Recipe, RecipeService } from '../services/recipe.service';

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

export const writeSchema = (document: Document, schema: SchemaObject[]) => {
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
};

export const schemaResolver: ResolveFn<SchemaObject[]> = (route, state) => {
  const document = inject(DOCUMENT);
  const loader = inject(IMAGE_LOADER);
  const baseHref = inject(APP_BASE_HREF);
  const appBaseHref = baseHref === '/' ? '' : baseHref.replace(/\/$/, '');
  const schema: SchemaObject[] = [];
  const origin = document.location.origin + appBaseHref;
  const path = state.url.split('?')[0].split('#')[0];
  const url = origin + path;

  const siteName = 'Delisha Marie';
  const description = route.data['description'];
  const slug = route.paramMap.get('slug') || '';

  const logoUrl = loader({
    src: '/delisha-marie-profile.jpg',
    width: 800,
  });
  schema.push(
    generateOrganizationSchema(origin, siteName, logoUrl, '800px', '800px'),
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
  schema.push(generateBreadcrumbSchema(breadcrumbs, origin, url));

  writeSchema(document, schema);

  return schema;
};

export const schemaDynamicPageResolver: ResolveFn<SchemaObject[]> = async (route, state) => {
  const document = inject(DOCUMENT);
  const loader = inject(IMAGE_LOADER);
  const baseHref = inject(APP_BASE_HREF);
  const appBaseHref = baseHref === '/' ? '' : baseHref.replace(/\/$/, '');
  const schema: SchemaObject[] = [];
  const origin = document.location.origin + appBaseHref;
  const path = state.url.split('?')[0].split('#')[0];
  const url = origin + path;

  const siteName = 'Delisha Marie';
  const description = route.data?.['description'];
  const slug = route.paramMap.get('slug') || route.data?.['slug'] || '';

  const logoUrl = loader({
    src: '/delisha-marie-profile.jpg',
    width: 800,
  });
  schema.push(
    generateOrganizationSchema(origin, siteName, logoUrl, '800px', '800px'),
    generateWebSiteSchema(origin, siteName),
    generateWebPageSchema(url, slug, siteName, description, '', ''),
  );

  if (slug === 'about') {
    schema.push(generateAboutPageSchema(url, siteName, description));
  } else if (slug === 'contact') {
    schema.push(generateContactPageSchema(url, siteName, description));
  } else if (slug === 'faq') {
    const pageService = inject(PagesService);
    const page = await pageService.getPage('faq');
    if (page) {
      const parsedFaqs = parseFaqContent(page.content);
      if (parsedFaqs.length > 0) {
        schema.push(generateFAQPageSchema(url, siteName, parsedFaqs));
      }
    }
  }

  const breadcrumbs = getBaseBreadcrumbs(path);
  schema.push(generateBreadcrumbSchema(breadcrumbs, origin, url));

  writeSchema(document, schema);

  return schema;
};

export const schemaRecipeResolver: ResolveFn<SchemaObject[]> = async (route, state) => {
  const document = inject(DOCUMENT);
  const baseHref = inject(APP_BASE_HREF);
  const loader = inject(IMAGE_LOADER);

  const siteName = 'Delisha Marie';
  const slug = route.paramMap.get('slug');

  if (!slug) return [];
  const recipeService = inject(RecipeService);
  const recipe = await recipeService.getRecipeBySlug(slug);

  if (!recipe) return [];
  recipe.comments = await recipeService.getTopComments(slug);

  const schema: SchemaObject[] = [];
  const appBaseHref = baseHref === '/' ? '' : baseHref.replace(/\/$/, '');
  const origin = document.location.origin.replace(/\/$/, '') + appBaseHref;
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
      '@id': `${url}#website`,
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
      '@id': `${url}#website`,
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
      '@id': `${url}#website`,
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
      '@id': `${url}#website`,
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
      '@id': `${url}#website`,
    },
    primaryImageOfPage: {
      '@id': `${url}#primaryimage`,
    },
    image: {
      '@id': `${url}#primaryimage`,
    },
    thumbnailUrl: `${thumbnailUrl}`,
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
  url: string,
): SchemaObject => {
  const items = breadcrumbs;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: items.map((b, index, arr) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: b.label,
      item: b.url && b !== arr.at(-1) ? `${baseUrl}/${b.url.replace(/^\//, '')}` : undefined,
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
  imageUrl: string,
  caption?: string,
): SchemaObject => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${url}#primaryimage`,
    url: imageUrl,
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
    thumbnailUrl: `${thumbnailUrl}`, // Todo
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
 * Strip HTML tags from a string linearly to avoid regex backtracking.
 */
export const stripHtml = (html: string, replaceWith = ''): string => {
  if (!html) return '';
  let result = '';
  let inTag = false;
  for (const element of html) {
    const char = element;
    if (char === '<') {
      inTag = true;
    } else if (char === '>') {
      inTag = false;
      result += replaceWith;
    } else if (!inTag) {
      result += char;
    }
  }
  return result;
};

/**
 * Parses FAQ HTML content into Question/Answer pairs.
 */
export const parseFaqContent = (content: string): { question: string; answer: string }[] => {
  const parsedFaqs: { question: string; answer: string }[] = [];
  const sections = content.split(/<h2[^>]*>/i);
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const endH2Idx = section.toLowerCase().indexOf('</h2>');
    if (endH2Idx === -1) continue;

    const question = stripHtml(section.substring(0, endH2Idx)).trim();
    const answer = stripHtml(section.substring(endH2Idx + 5), ' ').replace(/\s+/g, ' ').trim();
      
    if (question && answer) {
      parsedFaqs.push({ question, answer });
    }
  }
  return parsedFaqs;
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
