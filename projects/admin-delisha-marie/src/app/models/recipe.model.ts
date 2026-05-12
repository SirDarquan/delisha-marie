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

export interface NavigationLink {
  title: string;
  slug: string;
}

export interface Recipe {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  content: string;
  ingredients: string[];
  instructions: string[];
  image: string;
  category?: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  totalTime: string;
  yield: string;
  author: string;
  rating?: number;
  ratingCount?: number;
  featured?: boolean;
  comments?: Comment[];
  navigation?: {
    prev: NavigationLink | null;
    next: NavigationLink | null;
  };
}
