import { TestBed } from '@angular/core/testing';
import { IMAGE_LOADER } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useOptimizedContent } from './optimized-content';

describe('useOptimizedContent', () => {
  let mockSanitizer: Record<string, ReturnType<typeof vi.fn>>;
  let mockImageLoader: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustHtml: vi.fn((html) => html),
    };
    mockImageLoader = vi.fn(({ src, width }) => `${src}?w=${width}`);

    TestBed.configureTestingModule({
      providers: [
        { provide: DomSanitizer, useValue: mockSanitizer },
        { provide: IMAGE_LOADER, useValue: mockImageLoader },
      ],
    });
  });

  it('should return null if content is null or empty', () => {
    TestBed.runInInjectionContext(() => {
      const sig = signal<string | null>(null);
      const opt = useOptimizedContent(sig);
      expect(opt()).toBeNull();
    });
  });

  it('should ignore data URIs', () => {
    TestBed.runInInjectionContext(() => {
      const sig = signal('<img src="data:image/png;base64,123" alt="test">');
      const opt = useOptimizedContent(sig);
      expect(opt()).toBe('<img src="data:image/png;base64,123" alt="test">');
    });
  });

  it('should optimize relative URLs and add srcset', () => {
    TestBed.runInInjectionContext(() => {
      const sig = signal('<img src="/images/test.jpg" alt="test">');
      const opt = useOptimizedContent(sig);
      const result = opt() as unknown as string;
      expect(result).toContain('src="/images/test.jpg?w=800"');
      expect(result).toContain('/images/test.jpg?w=400 400w');
      expect(result).toContain('/images/test.jpg?w=1600 1600w');
      expect(result).toContain('loading="lazy"');
    });
  });

  it('should not add srcset for absolute URLs', () => {
    TestBed.runInInjectionContext(() => {
      const sig = signal('<img src="https://example.com/test.jpg" alt="test">');
      const opt = useOptimizedContent(sig);
      const result = opt() as unknown as string;
      expect(result).toContain('src="https://example.com/test.jpg"');
      expect(result).not.toContain('srcset');
      expect(result).toContain('loading="lazy"');
    });
  });

  it('should not override existing loading, decoding, or fetchpriority', () => {
    TestBed.runInInjectionContext(() => {
      const sig = signal(
        '<img src="/test.jpg" loading="eager" decoding="sync" fetchpriority="high">',
      );
      const opt = useOptimizedContent(sig);
      const result = opt() as unknown as string;
      expect(result).toContain('loading="eager"');
      expect(result).not.toContain('loading="lazy"');
      expect(result).toContain('decoding="sync"');
      expect(result).not.toContain('decoding="async"');
      expect(result).toContain('fetchpriority="high"');
      expect(result).not.toContain('fetchpriority="auto"');
    });
  });

  it('should handle missing src attribute', () => {
    TestBed.runInInjectionContext(() => {
      const sig = signal('<img alt="no src">');
      const opt = useOptimizedContent(sig);
      const result = opt() as unknown as string;
      expect(result).toBe('<img alt="no src">');
    });
  });

  it('should fallback gracefully if image loader throws', () => {
    TestBed.runInInjectionContext(() => {
      const sig = signal('<img src="/test.jpg" alt="test">');
      mockImageLoader.mockImplementation(() => {
        throw new Error('fail');
      });
      const opt = useOptimizedContent(sig);
      const result = opt() as unknown as string;
      expect(result).toContain('src="/test.jpg"');
      expect(result).toContain('loading="lazy"');
    });
  });
});
