export interface SeoData {
  title: string;
  description: string;
  image: string;
  imageWidth?: string;
  imageHeight?: string;
  imageType?: string;
  keywords?: string[];
}

export interface SeoContent extends SeoData {
  url: string;
  siteName: string;
  type?: string;
  twitterCard?: string;
  content?: string;
}

export type RecipeList = SeoData;

export interface SchemaObject {
  '@context'?: string;
  '@type'?: string;
  '@id'?: string;
  [key: string]:
    string | number | boolean | undefined | null | SchemaObject | (string | SchemaObject)[];
}

export interface SchemaBreadcrumb {
  label: string;
  url?: string;
}
