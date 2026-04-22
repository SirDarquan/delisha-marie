import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoContent } from '../models/seo-content';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  public setSEO(config: SeoContent): void {
    const formattedTitle = config.title || 'From my kitchen to yours | Delisha Marie ';

    // 1. Browser Title
    this.title.setTitle(formattedTitle);

    // 2. Canonical URL
    this.updateCanonicalUrl(config.url);

    // 3. Clear then Set Meta Tags
    this.removeAllMetaTags();

    // OpenGraph / Basic
    this.meta.addTag({ property: 'og:title', content: formattedTitle });
    this.meta.addTag({ name: 'description', content: config.description });
    this.meta.addTag({ property: 'og:description', content: config.description });
    this.meta.addTag({ property: 'og:url', content: config.url });
    this.meta.addTag({ property: 'og:site_name', content: config.siteName });
    this.meta.addTag({ property: 'og:type', content: config.type || 'website' });

    // Twitter
    this.meta.addTag({ name: 'twitter:title', content: formattedTitle });
    this.meta.addTag({ name: 'twitter:description', content: config.description });
    this.meta.addTag({
      name: 'twitter:card',
      content: config.twitterCard || 'summary_large_image',
    });

    // Images
    if (config.image) {
      this.meta.addTag({ property: 'og:image', content: config.image });
      this.meta.addTag({ name: 'twitter:image', content: config.image });
      if (config.imageWidth)
        this.meta.addTag({ property: 'og:image:width', content: config.imageWidth });
      if (config.imageHeight)
        this.meta.addTag({ property: 'og:image:height', content: config.imageHeight });
      if (config.imageType)
        this.meta.addTag({ property: 'og:image:type', content: config.imageType });
    }

    // Keywords
    if (config.keywords && config.keywords.length > 0) {
      this.meta.addTag({ name: 'keywords', content: config.keywords.join(', ') });
    }

    // Robots
    this.meta.addTag({ name: 'robots', content: config.content || 'index,follow' });
  }

  public updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private removeAllMetaTags(): void {
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:site_name"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:image:width"');
    this.meta.removeTag('property="og:image:height"');
    this.meta.removeTag('property="og:image:type"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="keywords"');
    this.meta.removeTag('name="robots"');
  }
}
