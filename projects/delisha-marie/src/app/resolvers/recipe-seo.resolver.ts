import { DOCUMENT, IMAGE_LOADER, PathLocationStrategy } from '@angular/common';
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
  const locationStrategy = inject(PathLocationStrategy);
  const loader = inject(IMAGE_LOADER);

  const origin = document.location.origin;
  const path = state.url.split('?')[0].split('#')[0];
  const siteName = "Delisha Marie's Kitchen";
  const slug = route.paramMap.get('slug') || undefined;
  const baseHref =
    locationStrategy.getBaseHref() === '/' ? '' : locationStrategy.getBaseHref().replace(/\/$/, '');
  const url = `${origin}${baseHref}${path}`;

  const seoConfig404: SeoContent = {
    title: `Recipe Not Found | ${siteName}`,
    description: '',
    url,
    siteName,
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
  const seo = await recipeService.getSeoBySlug(slug);

  if (!seo) {
    seoService.setSEO(seoConfig404);
    return seoConfig404;
  }
  let image = seo.image
    ? loader({
        src: seo.image,
        width: Number.parseInt(seo.imageWidth || '800', 10),
      })
    : '';
  if (image && !image.startsWith('http')) {
    image = `${origin}${image.startsWith('/') ? '' : '/'}${image}`;
  }
  const seoConfig: SeoContent = {
    title: `${seo.title} | ${siteName}`,
    description: seo.description || '',
    url,
    siteName,
    keywords: seo.keywords,
    image,
    imageWidth: seo.imageWidth,
    imageHeight: seo.imageHeight,
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
