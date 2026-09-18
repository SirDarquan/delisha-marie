import { APP_BASE_HREF, DOCUMENT, IMAGE_LOADER } from '@angular/common';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { deslugify } from '@dm/library';
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

export * from './recipe-schema.resolver';

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
    const answer = stripHtml(section.substring(endH2Idx + 5), ' ')
      .replace(/\s+/g, ' ')
      .trim();

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
