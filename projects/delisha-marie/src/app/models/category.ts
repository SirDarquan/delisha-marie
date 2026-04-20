export interface BaseCategory {
  name: string;
  url: string;
}

export interface Category extends BaseCategory {
  children?: Category[];
}

export interface FullCategory extends Category {
  image: string;
}

export interface Ingredient extends Category {
  count: number;
  children?: Ingredient[];
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
  ingredients: Ingredient[];
}
