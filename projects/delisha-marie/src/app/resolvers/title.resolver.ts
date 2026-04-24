import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { RecipeListService } from '../pages/recipe-list/recipe-list.service';

export const recipeListTitleResolver: ResolveFn<string> = (route) => {
  const category = route.paramMap.get('category') || undefined;
  const subCategory = route.paramMap.get('subcategory') || undefined;
  const page = route.paramMap.get('page') || undefined;
  const url = route.routeConfig?.path?.split('/')[0] || '';

  return inject(RecipeListService).getTitle({ url, category, subCategory, page });
};
