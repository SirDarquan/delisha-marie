import { BaseRecipe } from '@dm/library';

export interface NavigationLink {
  title: string;
  slug: string;
}

export interface Recipe extends BaseRecipe {
  status: 'draft' | 'scheduled' | 'published' | 'updated';
  preview_token?: string;
}
