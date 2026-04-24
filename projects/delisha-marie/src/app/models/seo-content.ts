export interface SeoContent extends SeoData {
  url: string;
  siteName: string;
  type?: string;
  twitterCard?: string;
  content?: string;
}

export interface SeoData {
  title: string;
  description: string;
  image: string;
  imageWidth?: string;
  imageHeight?: string;
  imageType?: string;
  keywords?: string[];
}

export type RecipeList = SeoData;
