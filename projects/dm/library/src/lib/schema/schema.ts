import { SchemaBreadcrumb, SchemaObject } from '../types/seo';
import { deslugify } from '../utils/url-utils';

export interface ArticleSchemaInput {
  title: string;
  slug?: string;
  description?: string;
  image?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  content?: string;
  author?: string;
  reviewCount?: number;
  rating?: number;
  ratingCount?: number;
  articleSection?: string[];
  keywords?: string[];
}

/**
 * Normalizes a URL by removing duplicate forward slashes except in protocol (e.g. https://).
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/([^:]\/)\/+/g, '$1');
};

/**
 * Injects or updates a JSON-LD schema script element in the document head.
 */
export const writeSchema = (
  document: Document,
  schema: SchemaObject[],
  scriptId = 'dynamic-schema',
): void => {
  const schemaObj = {
    '@context': 'https://schema.org',
    '@graph': schema,
  };

  let script = document.querySelector(`script#${scriptId}`);
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('id', scriptId);
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObj);
};

/**
 * Generate an Organization schema object.
 */
export const generateOrganizationSchema = (
  url: string,
  name: string,
  logoUrl: string,
  oWidth = '800px',
  oHeight = '800px',
  sameAs: string[] = [],
): SchemaObject => {
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${normalizedUrl}#organization`,
    name: name,
    url: normalizedUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${normalizedUrl}#/schema/logo/image`,
      url: logoUrl,
      contentUrl: logoUrl,
      width: oWidth,
      height: oHeight,
      caption: name,
      inLanguage: 'en-US',
    },
    image: {
      '@id': `${normalizedUrl}#/schema/logo/image`,
    },
    sameAs: sameAs,
  };
};

/**
 * Generate a WebSite schema object.
 */
export const generateWebSiteSchema = (url: string, siteName: string): SchemaObject => {
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${normalizedUrl}#website`,
    name: siteName,
    url: normalizedUrl,
    description: '',
    publisher: {
      '@id': `${normalizedUrl}#organization`,
    },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${normalizedUrl}?q={search_term_string}`,
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
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${normalizedUrl}`,
    url: normalizedUrl,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${normalizedUrl}#website`,
    },
    about: {
      '@id': `${normalizedUrl}#organization`,
    },
    breadcrumb: {
      '@id': `${normalizedUrl}#breadcrumb`,
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
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${normalizedUrl}#webpage`,
    url: normalizedUrl,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${normalizedUrl}#website`,
    },
    breadcrumb: {
      '@id': `${normalizedUrl}#breadcrumb`,
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
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${normalizedUrl}#webpage`,
    url: normalizedUrl,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${normalizedUrl}#website`,
    },
    breadcrumb: {
      '@id': `${normalizedUrl}#breadcrumb`,
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
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${normalizedUrl}#webpage`,
    url: normalizedUrl,
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
      '@id': `${normalizedUrl}#website`,
    },
    breadcrumb: {
      '@id': `${normalizedUrl}#breadcrumb`,
    },
    inLanguage: 'en-US',
  };
};

/**
 * Generate a WebPage schema object.
 */
export const generateWebPageSchema = (
  url: string,
  _slug: string,
  name: string,
  description: string,
  thumbnailUrl: string,
  datePublished: string,
): SchemaObject => {
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${normalizedUrl}#webpage`,
    url: normalizedUrl,
    name: name,
    description: description,
    isPartOf: {
      '@id': `${normalizedUrl}#website`,
    },
    primaryImageOfPage: {
      '@id': `${normalizedUrl}#primaryimage`,
    },
    image: {
      '@id': `${normalizedUrl}#primaryimage`,
    },
    thumbnailUrl: `${thumbnailUrl}`,
    datePublished: datePublished,
    breadcrumb: {
      '@id': `${normalizedUrl}#breadcrumb`,
    },
    inLanguage: 'en-US',
    potentialAction: [
      {
        '@type': 'ReadAction',
        target: [`${normalizedUrl}`],
      },
    ],
  };
};

/**
 * Generate a BreadcrumbList schema object.
 */
export const generateBreadcrumbSchema = (
  breadcrumbs: SchemaBreadcrumb[],
  baseUrl: string,
  url: string,
): SchemaObject => {
  const items = breadcrumbs;
  const normalizedBase = normalizeUrl(baseUrl).replace(/\/$/, '');
  const normalizedUrl = normalizeUrl(url);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${normalizedUrl}#breadcrumb`,
    itemListElement: items.map((b, index, arr) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: b.label,
      item:
        b.url && b !== arr.at(-1)
          ? normalizeUrl(`${normalizedBase}/${b.url.replace(/^\//, '')}`)
          : undefined,
    })),
  };
};

/**
 * Generate a Person schema object.
 */
export const generatePersonSchema = (url: string, name: string): SchemaObject => {
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${normalizedUrl}#/schema/person/`,
    name: name,
    sameAs: [normalizedUrl],
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
  const normalizedUrl = normalizeUrl(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${normalizedUrl}#primaryimage`,
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
  article: ArticleSchemaInput,
  url: string,
  thumbnailUrl: string,
  keywords: string[] = article.keywords || [],
  articleSection: string[] = article.articleSection || ['Article'],
  authorName?: string,
): SchemaObject => {
  const normalizedUrl = normalizeUrl(url);
  const baseUrl = normalizedUrl.split('/').slice(0, -2).join('/');
  const author = authorName || article.author || 'Author';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${normalizedUrl}#article`,
    isPartOf: {
      '@id': normalizedUrl,
    },
    author: {
      name: author,
      '@id': `${baseUrl}/#/schema/person/`,
    },
    headline: article.title,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    wordCount: stripHtml(article.content || '')
      .split(/\s+/)
      .filter((w) => w.length > 0).length,
    commentCount: article.reviewCount,
    mainEntityOfPage: {
      '@id': `${normalizedUrl}#webpage`,
    },
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    image: {
      '@id': `${normalizedUrl}#primaryimage`,
    },
    description: article.description,
    thumbnailUrl: `${thumbnailUrl}`,
    keywords: keywords,
    articleSection: articleSection,
    inLanguage: 'en-US',
    potentialAction: [
      {
        '@type': 'CommentAction',
        name: 'Comment',
        target: [`${normalizedUrl}#respond`],
      },
    ],
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
 * Converts natural duration representations (e.g. "1 day 2 hrs 15 mins") to ISO 8601 duration (PTxxM).
 */
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

/**
 * Generates breadcrumb items for base path navigation.
 */
export const getBaseBreadcrumbs = (currentCrumbs?: string): SchemaBreadcrumb[] => {
  const items: SchemaBreadcrumb[] = [];

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
