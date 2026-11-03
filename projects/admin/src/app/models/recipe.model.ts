import { BaseRecipe } from '@dm/library';

export interface NavigationLink {
  title: string;
  slug: string;
}

export interface Recipe extends BaseRecipe {
  status: 'draft' | 'published';
  previewToken?: string;
  equipment?: { title: string; url: string; image: string }[];
  searchIngredients?: string[];
}
