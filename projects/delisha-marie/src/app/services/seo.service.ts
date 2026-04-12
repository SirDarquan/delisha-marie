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

    // 3. Update @graph Schema
    this.updateSchema(config);
  }

  private updateSchema(config: SeoContent): void {
    const origin = this.document.location.origin;
    const url = config.url || this.document.location.href;

    const graph: unknown[] = [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'Delisha Marie',
        url: origin,
        logo: {
          '@type': 'ImageObject',
          '@id': `${origin}/#logo`,
          url: `${origin}/assets/logo.png`, // Placeholder
          contentUrl: `${origin}/assets/logo.png`,
          width: 512,
          height: 512,
          caption: 'Delisha Marie',
        },
        image: { '@id': `${origin}/#logo` },
        sameAs: [
          'https://instagram.com/delisha-marie',
          'https://pinterest.com/delisha-marie',
          'https://youtube.com/@delisha-marie',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: 'Delisha Marie',
        description: 'Authentic flavors, handcrafted with love.',
        publisher: { '@id': `${origin}/#organization` },
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${origin}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        ],
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebPage',
        '@id': `${url}/#webpage`,
        url: url,
        name: config.title,
        isPartOf: { '@id': `${origin}/#website` },
        about: { '@id': `${origin}/#organization` },
        description: config.description,
        inLanguage: 'en-US',
        potentialAction: [{ '@type': 'ReadAction', target: [url] }],
      },
    ];

    // Add Breadcrumbs if provided
    if (config.breadcrumbs && config.breadcrumbs.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${url}/#breadcrumb`,
        itemListElement: config.breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'WebPage',
            '@id': b.item,
            url: b.item,
            name: b.name,
          },
        })),
      });
    }

    // Add custom schema if provided
    if (config.schema) {
      const customSchema = Array.isArray(config.schema) ? config.schema : [config.schema];
      customSchema.forEach((s: unknown) => {
        graph.push(s);
      });
    }

    this.setScriptSchema({ '@context': 'https://schema.org', '@graph': graph });
  }

  private setScriptSchema(schema: unknown): void {
    let script = this.document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
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
