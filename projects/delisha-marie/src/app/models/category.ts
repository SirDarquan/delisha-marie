export interface Category {
  name: string;
  url: string;
  children?: Category[];
}

export interface FullCategory extends Category {
  image: string;
}

export interface RecipeIndexResponse {
  featuredCategories: FullCategory[];
  cookingMethods: FullCategory[];
  holidays: Category[];
  specialDiets: Category[];
  bestRecipes: Category[];
  // Full lists for the link-only sections
  categoriesList: Category[];
  methodsList: Category[];
}
