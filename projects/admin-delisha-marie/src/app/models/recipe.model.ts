import { BaseRecipe } from '@dm/library';

export interface NavigationLink {
  title: string;
  slug: string;
}

export interface Recipe extends BaseRecipe {
  featured?: boolean;
  status: 'draft' | 'scheduled' | 'published';
  preview_token?: string;
}
