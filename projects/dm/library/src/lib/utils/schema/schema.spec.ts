import { describe, expect, it, vi } from 'vitest';
import {
  convertToIso8601Duration,
  generateAboutPageSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateContactPageSchema,
  generateFAQPageSchema,
  generateImageObjectSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateWebPageSchema,
  generateWebSiteSchema,
  getBaseBreadcrumbs,
  normalizeUrl,
  parseFaqContent,
  stripHtml,
  writeSchema,
} from './schema';

describe('schema generators', () => {
  it('normalizeUrl removes duplicate slashes except in protocol', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('https://example.com//page///sub')).toBe('https://example.com/page/sub');
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
    expect(normalizeUrl('http://example.com//')).toBe('http://example.com/');
  });

  it('generateOrganizationSchema', () => {
    const result = generateOrganizationSchema(
      'https://example.com//',
      'Example',
      'logo.png',
      '100px',
      '100px',
      ['https://twitter.com/example'],
    );
    expect(result['@type']).toBe('Organization');
    expect(result['name']).toBe('Example');
    expect(result['url']).toBe('https://example.com/');
    expect(result['@id']).toBe('https://example.com/#organization');
    expect(result['sameAs']).toEqual(['https://twitter.com/example']);
    const logo = result['logo'] as Record<string, unknown>;
    expect(logo['url']).toBe('logo.png');
  });

  it('generateWebSiteSchema', () => {
    const result = generateWebSiteSchema('https://example.com//', 'Site');
    expect(result['@type']).toBe('WebSite');
    expect(result['name']).toBe('Site');
    expect(result['url']).toBe('https://example.com/');
    expect(result['@id']).toBe('https://example.com/#website');
    const actions = result['potentialAction'] as Record<string, unknown>[];
    expect(actions).toBeDefined();
    const target = actions[0]['target'] as Record<string, unknown>;
    expect(target['urlTemplate']).toBe('https://example.com/?q={search_term_string}');
  });

  it('generateCollectionPageSchema', () => {
    const result = generateCollectionPageSchema('https://example.com//collection', 'Col', 'Desc');
    expect(result['@type']).toBe('CollectionPage');
    expect(result['name']).toBe('Col');
    expect(result['@id']).toBe('https://example.com/collection');
  });

  it('generateAboutPageSchema', () => {
    const result = generateAboutPageSchema('https://example.com//about', 'About Us', 'Desc');
    expect(result['@type']).toBe('AboutPage');
    expect(result['name']).toBe('About Us');
    expect(result['@id']).toBe('https://example.com/about#webpage');
  });

  it('generateContactPageSchema', () => {
    const result = generateContactPageSchema('https://example.com//contact', 'Contact', 'Desc');
    expect(result['@type']).toBe('ContactPage');
    expect(result['name']).toBe('Contact');
    expect(result['@id']).toBe('https://example.com/contact#webpage');
  });

  it('generateFAQPageSchema', () => {
    const result = generateFAQPageSchema('https://example.com//faq', 'FAQ', [
      { question: 'Q1', answer: 'A1' },
    ]);
    expect(result['@type']).toBe('FAQPage');
    expect(result['@id']).toBe('https://example.com/faq#webpage');
    const entities = result['mainEntity'] as Record<string, unknown>[];
    expect(entities).toHaveLength(1);
    expect(entities[0]['name']).toBe('Q1');
  });

  it('generateWebPageSchema', () => {
    const result = generateWebPageSchema(
      'https://example.com//page',
      'page',
      'Page Name',
      'Page Desc',
      'thumb.jpg',
      '2026-01-01',
    );
    expect(result['@type']).toBe('WebPage');
    expect(result['name']).toBe('Page Name');
    expect(result['@id']).toBe('https://example.com/page#webpage');
    expect(result['url']).toBe('https://example.com/page');
  });

  it('generateBreadcrumbSchema without double slashes even with trailing slash baseUrl', () => {
    const result = generateBreadcrumbSchema(
      [{ label: 'Home', url: '/' }, { label: 'Sub', url: '/sub' }, { label: 'Current' }],
      'https://example.com/',
      'https://example.com//sub/current',
    );
    expect(result['@type']).toBe('BreadcrumbList');
    expect(result['@id']).toBe('https://example.com/sub/current#breadcrumb');
    const items = result['itemListElement'] as Record<string, unknown>[];
    expect(items).toHaveLength(3);
    expect(items[0]['item']).toBe('https://example.com/');
    expect(items[1]['item']).toBe('https://example.com/sub');
    expect(items[2]['item']).toBeUndefined();
  });

  it('generatePersonSchema', () => {
    const result = generatePersonSchema('https://example.com//', 'Chef Jane');
    expect(result['@type']).toBe('Person');
    expect(result['name']).toBe('Chef Jane');
    expect(result['@id']).toBe('https://example.com/#/schema/person/');
  });

  it('generateImageObjectSchema', () => {
    const result = generateImageObjectSchema('https://example.com//', 'img.png', 'Caption');
    expect(result['@type']).toBe('ImageObject');
    expect(result['caption']).toBe('Caption');
    expect(result['@id']).toBe('https://example.com/#primaryimage');
  });

  it('generateArticleSchema with custom author and sections', () => {
    const result = generateArticleSchema(
      {
        title: 'Article Title',
        content: '<p>Some article text with words</p>',
        author: 'Jane Doe',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
        description: 'Article desc',
        reviewCount: 5,
        keywords: ['tag1'],
        articleSection: ['Baking'],
      },
      'https://example.com//articles/sample',
      'thumb.png',
      ['tag1'],
      ['Baking'],
      'Jane Doe',
    );
    expect(result['@type']).toBe('Article');
    expect(result['headline']).toBe('Article Title');
    expect(result['@id']).toBe('https://example.com/articles/sample#article');
    const author = result['author'] as Record<string, unknown>;
    expect(author['name']).toBe('Jane Doe');
    expect(result['wordCount']).toBe(5);
    expect(result['commentCount']).toBe(5);
  });

  it('generateArticleSchema handles default fallback author and empty keywords/course', () => {
    const result = generateArticleSchema(
      { title: 'Article Without Author' },
      'https://example.com/article',
      'thumb.png',
    );
    expect(result['@type']).toBe('Article');
    const author = result['author'] as Record<string, unknown>;
    expect(author['name']).toBe('Author');
    expect(result['keywords']).toEqual([]);
    expect(result['articleSection']).toEqual(['Article']);
  });

  it('stripHtml and parseFaqContent', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    expect(stripHtml('')).toBe('');
    expect(stripHtml('no tags')).toBe('no tags');
    const faqs = parseFaqContent('<h2>What is this?</h2><p>An answer.</p>');
    expect(faqs).toEqual([{ question: 'What is this?', answer: 'An answer.' }]);
    expect(parseFaqContent('no h2 headers')).toEqual([]);
    expect(parseFaqContent('<h2>Incomplete header without end tag')).toEqual([]);
    expect(parseFaqContent('<h2>Empty Question</h2>   ')).toEqual([]);
  });

  it('convertToIso8601Duration handles combinations', () => {
    expect(convertToIso8601Duration('1 day 2 hrs 15 mins')).toBe('PT1575M');
    expect(convertToIso8601Duration('')).toBe('');
    expect(convertToIso8601Duration('none')).toBe('');
  });

  it('getBaseBreadcrumbs splits nested routes and handles empty', () => {
    expect(getBaseBreadcrumbs('')).toEqual([{ label: 'Home', url: '/' }]);
    const crumbs = getBaseBreadcrumbs('/recipes/desserts');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].label).toBe('Home');
    expect(crumbs[1].label).toBe('Recipes');
    expect(crumbs[2].label).toBe('Desserts');
  });

  it('writeSchema reuses existing script tag if already present', () => {
    const existingScript = { setAttribute: vi.fn(), textContent: '' };
    const mockDoc = {
      querySelector: vi.fn().mockReturnValue(existingScript),
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    } as unknown as Document;

    writeSchema(mockDoc, [{ '@type': 'WebSite' }]);
    expect(mockDoc.createElement).not.toHaveBeenCalled();
    expect(existingScript.textContent).toContain('WebSite');
  });

  it('writeSchema creates new script element if none present', () => {
    const createdScript = { setAttribute: vi.fn(), textContent: '' };
    const mockDoc = {
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockReturnValue(createdScript),
      head: { appendChild: vi.fn() },
    } as unknown as Document;

    writeSchema(mockDoc, [{ '@type': 'WebSite' }]);
    expect(mockDoc.createElement).toHaveBeenCalledWith('script');
    expect(createdScript.setAttribute).toHaveBeenCalledWith('id', 'dynamic-schema');
    expect(createdScript.setAttribute).toHaveBeenCalledWith('type', 'application/ld+json');
    expect(mockDoc.head.appendChild).toHaveBeenCalledWith(createdScript);
    expect(createdScript.textContent).toContain('WebSite');
  });
});
