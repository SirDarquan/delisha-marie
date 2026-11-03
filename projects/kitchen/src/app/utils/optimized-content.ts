import { IMAGE_LOADER } from '@angular/common';
import { computed, inject, Signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export function useOptimizedContent(
  contentSignal: Signal<string | null | undefined>,
): Signal<SafeHtml | null> {
  const sanitizer = inject(DomSanitizer);
  const imageLoader = inject(IMAGE_LOADER);

  return computed(() => {
    const content = contentSignal();
    if (!content) return null;

    const optimizedHtml = content.replace(/<img([^>]+)>/gi, (match, attrs) => {
      const srcMatch = attrs.match(/(?:src)=["']([^"']+)["']/i);
      if (!srcMatch) return match;

      const originalSrc = srcMatch[1];
      if (originalSrc.startsWith('data:')) return match;

      try {
        const isAbsolute = originalSrc.startsWith('http://') || originalSrc.startsWith('https://');

        let optimizedSrc = originalSrc;
        let srcsetAttr = '';

        if (!isAbsolute) {
          optimizedSrc = imageLoader({ src: originalSrc, width: 800 });
          const srcset = `
            ${imageLoader({ src: originalSrc, width: 400 })} 400w,
            ${imageLoader({ src: originalSrc, width: 800 })} 800w,
            ${imageLoader({ src: originalSrc, width: 1200 })} 1200w,
            ${imageLoader({ src: originalSrc, width: 1600 })} 1600w
          `
            .replace(/\\s+/g, ' ')
            .trim();
          srcsetAttr = ` srcset="${srcset}" sizes="(max-width: 768px) 100vw, 800px"`;
        }

        let newAttrs = attrs;
        newAttrs = newAttrs.replace(/(?:src)=["'][^"']+["']/gi, '');

        if (!/loading=/i.test(newAttrs)) newAttrs += ' loading="lazy"';
        if (!/decoding=/i.test(newAttrs)) newAttrs += ' decoding="async"';
        if (!/fetchpriority=/i.test(newAttrs)) newAttrs += ' fetchpriority="auto"';

        return `<img src="${optimizedSrc}"${srcsetAttr}${newAttrs}>`;
      } catch {
        let newAttrs = attrs.replace(/src=["']([^"']+)["']/gi, 'src="$1"');
        if (!/loading=/i.test(newAttrs)) newAttrs += ' loading="lazy"';
        return `<img${newAttrs}>`;
      }
    });

    return sanitizer.bypassSecurityTrustHtml(optimizedHtml);
  });
}
