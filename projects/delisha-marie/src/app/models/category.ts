export interface Category {
  name: string;
  image: string;
  url: string;
}

export interface RecipeIndexResponse {
  featuredCategories: Category[];
}
