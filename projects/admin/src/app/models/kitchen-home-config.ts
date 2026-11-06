export interface ProfilePictureOption {
  readonly id: string;
  readonly filename: string;
  readonly label: string;
  readonly description: string;
}

export const ABOUT_ME_PICTURE_OPTIONS: readonly ProfilePictureOption[] = [
  {
    id: 'about-pic',
    filename: 'delisha_marie_profile.png',
    label: 'About Page Picture',
    description: 'Classic portrait from the About page',
  },
  {
    id: 'kitchen-pic',
    filename: 'delisha_marie_profile_2.png',
    label: 'Kitchen Home Picture',
    description: 'Casual kitchen portrait',
  },
] as const;

export interface KitchenHomeConfig {
  featuredRecipes?: string[];
  picture?: string;
  title?: string;
  description?: string;
}

export function parseKitchenHomeConfig(content?: string): KitchenHomeConfig {
  if (!content) return { picture: 'delisha_marie_profile_2.png', featuredRecipes: ['', '', ''] };
  try {
    const parsed = JSON.parse(content);
    return {
      picture: parsed.picture || 'delisha_marie_profile_2.png',
      featuredRecipes: parsed.featuredRecipes || ['', '', ''],
      ...parsed,
    };
  } catch {
    return { picture: 'delisha_marie_profile_2.png', featuredRecipes: ['', '', ''] };
  }
}
