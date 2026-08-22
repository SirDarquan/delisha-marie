export interface Breadcrumb {
  label: string;
  url?: string;
}

export interface Breadcrumbs {
  main?: number;
  items: Breadcrumb[][];
}

export interface Nutrition {
  calories: string;
  carbohydrates: string;
  protein: string;
  fat: string;
  saturatedFat: string;
  cholesterol: string;
  sodium: string;
  fiber: string;
  sugar: string;
  servingSize: string;
}

export interface Comment {
  id: string;
  parentId?: string;
  recipeId: string;
  author: string;
  email: string;
  content: string;
  rating?: number;
  website?: string;
  createdAt: string;
}

export interface BaseTrail {
  name: string;
  url: string;
}

export interface CategoryTrails {
  trails: BaseTrail[][];
}

export interface BaseRecipe {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  content: string;
  ingredients: string[];
  instructions: string[];
  image: string;
  imageWidth?: string;
  imageHeight?: string;
  imageType?: string;
  theBest?: boolean;
  favorite?: boolean;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  totalTime: string;
  yield: string;
  author: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  rating?: number;
  ratingCount?: number;
  reviewCount?: number;
  topCommentsCount?: number;
  newCommentsCount?: number;
  comments?: Comment[];
  notes?: string[];
  nutrition?: Nutrition;
  cuisine?: string;
  course?: string;
  method?: string;
  category?: string | CategoryTrails;
  breadcrumbs?: Breadcrumbs | null;
  keywords?: string[];
  specialDiets?: string[];
  holidays?: string[];
  status: 'draft' | 'published';
  likes?: number;
  source?: string;
  video?: string | null;
}
