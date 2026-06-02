import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { SeoService } from './seo.service';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('SeoService', () => {
  let service: SeoService;
  let metaService: Meta;
  let mockDocument: {
    location: { origin: string; href: string };
    querySelector: Mock;
    createElement: Mock;
    head: { appendChild: Mock };
  };

  beforeEach(() => {
    mockDocument = {
      location: { origin: 'https://test.com', href: 'https://test.com/page' },
      querySelector: vi.fn(),
      createElement: vi.fn().mockReturnValue({ setAttribute: vi.fn() }),
      head: { appendChild: vi.fn() },
    };

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Meta, useValue: { addTag: vi.fn(), removeTag: vi.fn() } },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });
    service = TestBed.inject(SeoService);
    metaService = TestBed.inject(Meta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set full SEO config', () => {
    service.setSEO({
      title: 'Title',
      description: 'Desc',
      url: 'https://test.com/page',
      siteName: 'Site',
      keywords: ['key'],
      image: 'https://test.com/img.jpg',
    });

    expect(metaService.addTag).toHaveBeenCalledWith({ property: 'og:title', content: 'Title' });
    expect(metaService.addTag).toHaveBeenCalledWith({ name: 'description', content: 'Desc' });
    expect(metaService.addTag).toHaveBeenCalledWith({
      property: 'og:url',
      content: 'https://test.com/page',
    });
    expect(metaService.addTag).toHaveBeenCalledWith({ name: 'keywords', content: 'key' });
  });

  it('should update canonical url', () => {
    const mockLink = { setAttribute: vi.fn() };
    mockDocument.querySelector.mockReturnValue(null);
    mockDocument.createElement.mockReturnValue(mockLink as unknown as HTMLLinkElement);

    service.updateCanonicalUrl('https://test.com/canonical');

    expect(mockDocument.createElement).toHaveBeenCalledWith('link');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'https://test.com/canonical');
  });

  it('should handle setSEO with default fallbacks and no image/keywords', () => {
    service.setSEO({
      title: '',
      image: '',
      description: 'Desc',
      url: 'https://test.com/page',
      siteName: 'Site',
    });

    expect(metaService.addTag).toHaveBeenCalledWith({
      property: 'og:title',
      content: 'From my kitchen to yours | Delisha Marie ',
    });
    expect(metaService.addTag).toHaveBeenCalledWith({ property: 'og:type', content: 'website' });
    expect(metaService.addTag).toHaveBeenCalledWith({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    expect(metaService.addTag).toHaveBeenCalledWith({ name: 'robots', content: 'index,follow' });

    expect(metaService.addTag).not.toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:image' }),
    );
    expect(metaService.addTag).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'keywords' }),
    );
  });

  it('should add image meta tags when image and optional sizes/types are present', () => {
    service.setSEO({
      title: 'Title',
      description: 'Desc',
      url: 'https://test.com/page',
      siteName: 'Site',
      image: 'https://test.com/img.jpg',
      imageWidth: '800',
      imageHeight: '600',
      imageType: 'image/jpeg',
    });

    expect(metaService.addTag).toHaveBeenCalledWith({
      property: 'og:image:width',
      content: '800',
    });
    expect(metaService.addTag).toHaveBeenCalledWith({
      property: 'og:image:height',
      content: '600',
    });
    expect(metaService.addTag).toHaveBeenCalledWith({
      property: 'og:image:type',
      content: 'image/jpeg',
    });
  });

  it('should reuse existing canonical link element if present', () => {
    const mockLink = { setAttribute: vi.fn() };
    mockDocument.querySelector.mockReturnValue(mockLink);

    service.updateCanonicalUrl('https://test.com/new-canonical');

    expect(mockDocument.createElement).not.toHaveBeenCalled();
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'https://test.com/new-canonical');
  });
});
