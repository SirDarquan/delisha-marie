import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PagesService } from '../services/pages.service';

export const dynamicPageResolver: ResolveFn<string> = async (route) => {
  const slug = route.paramMap.get('slug') || route.data?.['slug'];
  if (!slug) return 'Page not found';
  const page = await inject(PagesService).getPage(slug);
  return page?.title || 'Page Not Found';
};
