import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SeoContent } from '../models/seo-content';
import { RecipeService } from '../services/recipe.service';
import { SeoService } from '../services/seo.service';
import { resolveDynamicOrigin } from './seo.resolver';

export const seoRecipeResolver: ResolveFn<SeoContent> = async (route, state) => {
  const seoService = inject(SeoService);
  const recipeService = inject(RecipeService);
  const document = inject(DOCUMENT);
  const baseHref = inject(APP_BASE_HREF);

  const origin = document.location.origin;
  const path = state.url.split('?')[0].split('#')[0];
  const siteName = "Delisha Marie's Kitchen";
  const slug = route.paramMap.get('slug') || undefined;
  const appBaseHref = baseHref === '/' ? '' : baseHref;
  const url = `${origin}${appBaseHref}${path}`;

  const seoConfig404: SeoContent = {
    title: `Recipe Not Found | ${siteName}`,
    description: '',
    url,
    siteName: siteName,
    keywords: [],
    image: '',
    type: 'website',
    twitterCard: 'summary_large_image',
    content: 'noindex,nofollow',
  };

  if (!slug) {
    seoService.setSEO(seoConfig404);
    return seoConfig404;
  }
  const seo = await recipeService.getSEOBySlug(slug);

  if (!seo) {
    seoService.setSEO(seoConfig404);
    return seoConfig404;
  }

  const seoConfig: SeoContent = {
    title: `${seo.title} | ${siteName}`,
    description: seo.description || '',
    url,
    siteName: siteName,
    keywords: seo.keywords,
    image: seo.image ? `${origin}${seo.image}` : '',
    imageWidth: seo.imageWidth != null ? String(seo.imageWidth) : undefined,
    imageHeight: seo.imageHeight != null ? String(seo.imageHeight) : undefined,
    imageType: seo.imageType,
    type: 'website',
    twitterCard: 'summary_large_image',
    content: 'index,follow',
  };

  const resolvedSeo = resolveDynamicOrigin(seoConfig, origin);

  // Trigger earliest possible SEO update
  seoService.setSEO(resolvedSeo);

  return resolvedSeo;
};
