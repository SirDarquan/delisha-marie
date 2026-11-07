export interface ProfilePictureOption {
  readonly id: string;
  readonly filename: string;
  readonly label: string;
  readonly description: string;
}

export const DEFAULT_ABOUT_ME_PICTURE_1 = 'delisha_marie_profile.png';
export const DEFAULT_ABOUT_ME_PICTURE_2 = 'delisha_marie_profile_2.png';

export function getKitchenPictureOptions(config?: KitchenHomeConfig): ProfilePictureOption[] {
  const pic1 = config?.picture1 || DEFAULT_ABOUT_ME_PICTURE_1;
  const pic2 = config?.picture2 || DEFAULT_ABOUT_ME_PICTURE_2;
  return [
    {
      id: 'about-pic',
      filename: pic1,
      label: 'About Page Picture',
      description: 'Classic portrait from the About page',
    },
    {
      id: 'kitchen-pic',
      filename: pic2,
      label: 'Kitchen Home Picture',
      description: 'Casual kitchen portrait',
    },
  ];
}

export const ABOUT_ME_PICTURE_OPTIONS: readonly ProfilePictureOption[] = getKitchenPictureOptions();

export interface KitchenHomeConfig {
  featuredRecipes?: string[];
  picture?: string;
  picture1?: string;
  picture2?: string;
  title?: string;
  description?: string;
  content?: string;
}

export function parseKitchenHomeConfig(content?: string): KitchenHomeConfig {
  const defaults: KitchenHomeConfig = {
    picture1: DEFAULT_ABOUT_ME_PICTURE_1,
    picture2: DEFAULT_ABOUT_ME_PICTURE_2,
    picture: DEFAULT_ABOUT_ME_PICTURE_2,
    featuredRecipes: ['', '', ''],
  };

  if (!content) return defaults;
  try {
    const parsed = JSON.parse(content);
    const pic1 = parsed.picture1 || DEFAULT_ABOUT_ME_PICTURE_1;
    const pic2 = parsed.picture2 || DEFAULT_ABOUT_ME_PICTURE_2;
    return {
      ...parsed,
      picture1: pic1,
      picture2: pic2,
      picture: parsed.picture || pic2,
      featuredRecipes: parsed.featuredRecipes || ['', '', ''],
    };
  } catch {
    return defaults;
  }
}
