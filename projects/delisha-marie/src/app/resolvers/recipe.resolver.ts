import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { RecipeListService } from '../pages/recipe-list/recipe-list.service';
import { Recipe, RecipeService } from '../services/recipe.service';

export const recipeResolver: ResolveFn<Recipe | null> = (route) => {
  const slug = route.paramMap.get('slug');
  if (!slug) return null;

  return inject(RecipeService).getRecipeBySlug(slug);
};

export const recipeListTitleResolver: ResolveFn<string> = (route) => {
  const category = route.paramMap.get('category') || undefined;
  const subCategory = route.paramMap.get('subcategory') || undefined;
  const page = route.paramMap.get('page') || undefined;
  const url = route.routeConfig?.path?.split('/')[0] || '';

  return inject(RecipeListService).getTitle({ url, category, subCategory, page });
};

export const recipeTitleResolver: ResolveFn<string> = (route) => {
  const slug = route.paramMap.get('slug');
  if (!slug) return 'Recipe Not Found';

  return inject(RecipeService)
    .getTitle(slug)
    .then((title) => title || 'Recipe Not Found');
};
