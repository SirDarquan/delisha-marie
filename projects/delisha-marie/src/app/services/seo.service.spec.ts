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
    });

    expect(metaService.addTag).toHaveBeenCalledWith({ property: 'og:title', content: 'Title' });
    expect(metaService.addTag).toHaveBeenCalledWith({ name: 'description', content: 'Desc' });
    expect(metaService.addTag).toHaveBeenCalledWith({
      property: 'og:url',
      content: 'https://test.com/page',
    });
    expect(metaService.addTag).toHaveBeenCalledWith({ name: 'keywords', content: 'key' });
  });

  it('should inject @graph script schema', () => {
    const mockScript = { textContent: '', setAttribute: vi.fn() };
    mockDocument.querySelector.mockReturnValue(null);
    mockDocument.createElement.mockReturnValue(mockScript);

    service.setSEO({
      title: 'Test Page',
      description: 'Test Desc',
      url: 'https://test.com/test',
      siteName: 'Test Site',
    });

    expect(mockDocument.createElement).toHaveBeenCalledWith('script');
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
    const schema = JSON.parse(mockScript.textContent);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@graph']).toBeDefined();
    expect(
      schema['@graph'].some((item: { '@type': string }) => item['@type'] === 'Organization'),
    ).toBe(true);
    expect(schema['@graph'].some((item: { '@type': string }) => item['@type'] === 'WebPage')).toBe(
      true,
    );
  });

  it('should update canonical url', () => {
    const mockLink = { setAttribute: vi.fn() };
    mockDocument.querySelector.mockReturnValue(null);
    mockDocument.createElement.mockReturnValue(mockLink as unknown as HTMLLinkElement);

    service.updateCanonicalUrl('https://test.com/canonical');

    expect(mockDocument.createElement).toHaveBeenCalledWith('link');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'https://test.com/canonical');
  });
});
