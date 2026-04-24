import { Injectable } from '@angular/core';
import { RecipeList } from '../../models/seo-content';

@Injectable({
  providedIn: 'root',
})
export class RecipeListService {
  getInfo(variables: {
    url: string;
    category?: string;
    subCategory?: string;
    page?: string;
  }): RecipeList {
    const title = this.getTitle(variables);

    return {
      title,
      description: `Browse our collection of delicious ${title.toLowerCase()} recipes and culinary ideas.`,
      image:
        'https://images.unsplash.com/photo-1546271876-af6caec5fae5?auto=format&fit=crop&w=800&q=80',
      imageWidth: '800',
      imageHeight: '800',
      imageType: 'image/jpeg',
    };
  }

  getTitle(variables: {
    url: string;
    category?: string;
    subCategory?: string;
    page?: string;
  }): string {
    let title = variables.url.replaceAll('-', ' ').replaceAll(/\b\w/g, (l) => l.toUpperCase());
    if (variables.category) {
      title = `${variables.category.replaceAll('-', ' ').replaceAll(/\b\w/g, (l) => l.toUpperCase())}`;
    }
    if (variables.subCategory) {
      const subTitle = variables.subCategory
        .replaceAll('-', ' ')
        .replaceAll(/\b\w/g, (l) => l.toUpperCase());
      title = variables.category ? `${subTitle} ${title}` : subTitle;
    }

    if (variables.page && Number.parseInt(variables.page) > 1) {
      title += ` - Page ${variables.page}`;
    }

    return title || 'Recipe List';
  }
}
