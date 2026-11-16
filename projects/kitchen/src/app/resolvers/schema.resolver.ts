import { DOCUMENT, IMAGE_LOADER, PathLocationStrategy } from '@angular/common';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  generateAboutPageSchema,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateContactPageSchema,
  generateFAQPageSchema,
  generateOrganizationSchema as dmlGenerateOrganizationSchema,
  generateWebPageSchema,
  generateWebSiteSchema,
  getBaseBreadcrumbs,
  normalizeUrl,
  parseFaqContent,
  SchemaBreadcrumb,
  SchemaObject,
  writeSchema,
} from '@dm/library';
import { PagesService } from '../services/pages.service';

export type { SchemaBreadcrumb, SchemaObject };
export type Breadcrumb = SchemaBreadcrumb;

export {
  convertToIso8601Duration,
  generateAboutPageSchema,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateContactPageSchema,
  generateFAQPageSchema,
  generateImageObjectSchema,
  generatePersonSchema,
  generateWebPageSchema,
  generateWebSiteSchema,
  getBaseBreadcrumbs,
  normalizeUrl,
  parseFaqContent,
  stripHtml,
  writeSchema,
} from '@dm/library';

export const DELISHA_MARIE_SITE_NAME = 'Delisha Marie';
export const DELISHA_MARIE_PROFILE_IMAGE = '/delisha_marie_profile.jpg';
export const DELISHA_MARIE_SOCIAL_PROFILES = [
  'https://www.facebook.com/delisha-marie/',
  'https://x.com/delisha-marie',
  'https://www.instagram.com/delishamarie_/',
];

export const generateOrganizationSchema = (
  url: string,
  name: string,
  logoUrl: string,
  oWidth: string,
  oHeight: string,
  sameAs: string[] = DELISHA_MARIE_SOCIAL_PROFILES,
): SchemaObject => {
  return dmlGenerateOrganizationSchema(url, name, logoUrl, oWidth, oHeight, sameAs);
};

export const schemaResolver: ResolveFn<SchemaObject[]> = (route, state) => {
  const document = inject(DOCUMENT);
  const loader = inject(IMAGE_LOADER);
  const locationStrategy = inject(PathLocationStrategy);
  const appBaseHref =
    locationStrategy.getBaseHref() === '/' ? '' : locationStrategy.getBaseHref().replace(/\/$/, '');
  const schema: SchemaObject[] = [];
  const origin = normalizeUrl(document.location.origin.replace(/\/$/, '') + appBaseHref);
  const path = state.url.split('?')[0].split('#')[0];
  const url = normalizeUrl(`${origin}/${path.replace(/^\//, '')}`);

  const siteName = DELISHA_MARIE_SITE_NAME;
  const description = route.data['description'];
  const slug = route.paramMap.get('slug') || '';

  const logoUrl = loader({
    src: DELISHA_MARIE_PROFILE_IMAGE,
    width: 800,
  });
  schema.push(
    generateOrganizationSchema(
      origin,
      siteName,
      logoUrl,
      '800px',
      '800px',
      DELISHA_MARIE_SOCIAL_PROFILES,
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
  schema.push(generateBreadcrumbSchema(breadcrumbs, origin, url));

  writeSchema(document, schema);

  return schema;
};

export const schemaDynamicPageResolver: ResolveFn<SchemaObject[]> = async (route, state) => {
  const document = inject(DOCUMENT);
  const loader = inject(IMAGE_LOADER);
  const locationStrategy = inject(PathLocationStrategy);
  const appBaseHref =
    locationStrategy.getBaseHref() === '/' ? '' : locationStrategy.getBaseHref().replace(/\/$/, '');
  const schema: SchemaObject[] = [];
  const origin = normalizeUrl(document.location.origin.replace(/\/$/, '') + appBaseHref);
  const path = state.url.split('?')[0].split('#')[0];
  const url = normalizeUrl(`${origin}/${path.replace(/^\//, '')}`);

  const siteName = DELISHA_MARIE_SITE_NAME;
  const description = route.data?.['description'];
  const slug = route.paramMap.get('slug') || route.data?.['slug'] || '';

  const logoUrl = loader({
    src: DELISHA_MARIE_PROFILE_IMAGE,
    width: 800,
  });
  schema.push(
    generateOrganizationSchema(
      origin,
      siteName,
      logoUrl,
      '800px',
      '800px',
      DELISHA_MARIE_SOCIAL_PROFILES,
    ),
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
