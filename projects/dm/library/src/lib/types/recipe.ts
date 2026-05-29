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
  prepTime: string;
  cookTime: string;
  difficulty: string;
  totalTime: string;
  yield: string;
  author: string;
  createdAt?: string;
  updatedAt?: string;
  rating?: number;
  ratingCount?: number;
  reviewCount?: number;
  comments?: Comment[];
  notes?: string[];
  equipment?: string[];
  nutrition?: Nutrition;
  cuisine?: string;
  course?: string;
  method?: string;
  category?: string;
  subcategory?: string;
  breadcrumbs?: Breadcrumbs;
  keywords?: string[];
  specialDiets?: string[];
  holidays?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'updated';
  likes?: number;
}
