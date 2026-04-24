import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { Recipe } from '../services/recipe.service';
import { deslugify } from '../utils/slug';

export interface SchemaObject {
  '@context'?: string;
  '@type'?: string;
  '@id'?: string;
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | null
    | SchemaObject
    | (string | SchemaObject)[];
}

export interface Breadcrumb {
  label: string;
  url?: string;
}

export const schemaResolver: ResolveFn<Record<string, unknown>[]> = (route, state) => {
  const document = inject(DOCUMENT);
  const schema: Record<string, unknown>[] = [];
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
  } else if (url.includes('/about')) {
    schema.push(generateAboutPageSchema(url, siteName, description));
  } else if (url.includes('/contact')) {
    schema.push(generateContactPageSchema(url, siteName, description));
    // } else if (url.includes('/faq')) {
    //   const breadcrumbs = breadcrumbService.getBaseBreadcrumbs(route.data['breadcrumbs'], true);
    //   return from(faqService.getFAQs()).pipe(
    //     map((faqs) => {
    //       schema.push(generateFAQPageSchema(url, name, faqs));
    //       schema.push(generateBreadcrumbSchema(breadcrumbs, origin, ''));
    //       return {
    //         '@context': 'https://schema.org',
    //         '@graph': schema,
    //       };
    //     }),
    //   );
  } else {
    schema.push(generateWebPageSchema(url, slug, siteName, description, '', ''));
  }

  const breadcrumbs = getBaseBreadcrumbs(path);
  schema.push(generateBreadcrumbSchema(breadcrumbs, origin, path));

  if (schema) {
    const schemaObj = {
      '@context': 'https://schema.org',
      '@graph': [schema],
    };

    let script = document.querySelector('script#dynamic-schema');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('id', 'dynamic-schema');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemaObj);
  }

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
    '@id': `${url}${slug}#webpage`,
    url: url,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${url.split('/').slice(0, 3).join('/')}/#website`,
    },
    primaryImageOfPage: {
      '@id': `${url}${slug}#primaryimage`,
    },
    image: {
      '@id': `${url}${slug}#primaryimage`,
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
        target: [`${url}${slug}`],
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
      item: b.url ? baseUrl + b.url : undefined,
    })),
  };
};

/**
 * Generates a standardized list of breadcrumbs based on the user's specific order:
 * Home -> Recipes -> Category -> [Subcategory] -> Recipe
 * Also dynamically generates supplemental trails (main: false) for The Best, Method, Diets, and Holidays.
 */
export const getRecipeBreadcrumbs = (recipe: Recipe): Breadcrumb[] => {
  const finalGroups: Breadcrumb[] = [];
  const recipeLabel = recipe.title;
  const recipeUrl = `/recipe/${recipe.slug}`;

  const generateTrail = (isMain: boolean, intermediateCrumbs: Breadcrumb[]) => {
    const items: Breadcrumb[] = [];

    // 1. Ensure "Recipes" is the start for the main trail
    if (isMain && (!intermediateCrumbs.length || intermediateCrumbs[0].label !== 'Recipes')) {
      items.push({ label: 'Recipes', url: '/recipes' });
    }

    // 2. Add mid-level crumbs
    intermediateCrumbs.forEach((crumb) => {
      const labelSafe = crumb.label?.toLowerCase() || '';
      // Skip dupes
      if (labelSafe !== 'home' && crumb.label !== recipeLabel) {
        items.push(crumb);
      }
    });

    // 2. Close with the recipe
    items.push({ label: recipeLabel, url: recipeUrl });

    finalGroups.push(...items);
  };

  // --- Trails from Database ---
  // const mainGroup = recipe.breadcrumbs?.find((g) => g.main) || recipe.breadcrumbs?.[0];
  // const sourceItems = [...(mainGroup?.items || [])].filter(
  //   (b) => b && b.label !== 'Home' && b.label !== 'Recipe',
  // );

  // const dbBreadcrumbs = recipe.breadcrumbs || [];
  // if (dbBreadcrumbs.length > 0) {
  //   dbBreadcrumbs.forEach((group) => {
  //     const items = [...(group.items || [])].filter(
  //       (b) => b && b.label !== 'Home' && b.label !== 'Recipe',
  //     );
  //     generateTrail(group.main || false, items);
  //   });
  // } else {
  //   generateTrail(true, sourceItems);
  // }

  // --- Dynamic Supplementary Trails (main: false) ---
  // The Best Trail
  // if (recipe.theBest) {
  //   const bestCrumbs: Breadcrumb[] = [{ label: 'The Best Recipes', url: '/recipes/the-best' }];

  //   // Take categories from the main trail and prepend "The Best "
  //   sourceItems.forEach((b) => {
  //     if (b.label !== 'Recipes') {
  //       bestCrumbs.push({
  //         label: `The Best ${b.label}`,
  //         url: b.url?.replace('/recipes/', '/recipes/the-best/'),
  //       });
  //     }
  //   });

  //   generateTrail(false, bestCrumbs);
  // }

  // Method Trail
  if (recipe.method) {
    const slug = recipe.method
      .toLowerCase()
      .replaceAll(' ', '-')
      .replaceAll(/[^a-z0-9-]/g, '');
    generateTrail(false, [
      { label: 'Method', url: '/method' },
      { label: recipe.method, url: `/method/${slug}` },
    ]);
  }

  // Special Diets Trails
  const specialDiets = (recipe as unknown as Record<string, unknown>)['specialDiets'];
  if (specialDiets && Array.isArray(specialDiets) && specialDiets.length) {
    specialDiets.forEach((diet: string) => {
      const slug = diet
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll(/[^a-z0-9-]/g, '');
      generateTrail(false, [
        { label: 'Special Diets', url: '/special-diets' },
        { label: diet, url: `/special-diets/${slug}` },
      ]);
    });
  }

  // Holidays Trails
  const holidays = (recipe as unknown as Record<string, unknown>)['holidays'];
  if (holidays && Array.isArray(holidays) && holidays.length) {
    holidays.forEach((holiday: string) => {
      const slug = holiday
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll(/[^a-z0-9-]/g, '');
      generateTrail(false, [
        { label: 'Holidays', url: '/holidays' },
        { label: holiday, url: `/holidays/${slug}` },
      ]);
    });
  }

  return finalGroups;
};

/**
 * Generates breadcrumbs for list pages or other static pages.
 */
export const getBaseBreadcrumbs = (currentCrumbs?: string): Breadcrumb[] => {
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
    {
      deslugify(currentCrumbs);
    }
  }
  return items;
};
