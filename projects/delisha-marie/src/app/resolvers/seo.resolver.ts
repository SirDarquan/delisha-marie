import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SeoContent } from '../models/seo-content';
import { SeoService } from '../services/seo.service';
import { DOCUMENT } from '@angular/common';

export const seoResolver: ResolveFn<Partial<SeoContent>> = (route, state) => {
  const seoService = inject(SeoService);
  const document = inject(DOCUMENT);

  const data = route.data as Partial<SeoContent>;
  const origin = document.location.origin;

  // Construct perfect canonical URL
  const path = state.url.split('?')[0].split('#')[0];
  const url = `${origin}${path === '/' ? '' : path}`;

  const seoConfig: SeoContent = {
    title: `${route.title} | Delisha Marie`,
    description: data.description || '',
    url: url,
    siteName: 'Delisha Marie',
    keywords: data.keywords,
    image: data.image ? `${origin}${data.image}` : '',
    imageWidth: data.imageWidth,
    imageHeight: data.imageHeight,
    type: data.type || 'website',
    twitterCard: data.twitterCard || 'summary_large_image',
    content: data.content || 'index,follow',
  };

  // Recursively resolve dynamic origin placeholders
  const resolvedSeo = resolveDynamicOrigin(seoConfig, origin);

  // Trigger earliest possible SEO update
  seoService.setSEO(resolvedSeo);

  return resolvedSeo;
};

/**
 * Recursively replaces {{origin}} placeholders with the actual origin.
 */
function resolveDynamicOrigin<T>(target: T, origin: string): T {
  if (typeof target === 'string') {
    return target.replaceAll('{{origin}}', origin) as T;
  }

  if (Array.isArray(target)) {
    return target.map((item) => resolveDynamicOrigin(item, origin)) as T;
  }

  if (target !== null && typeof target === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(target)) {
      result[key] = resolveDynamicOrigin(value, origin);
    }
    return result as T;
  }

  return target;
}
