import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

// Define the injection token
export const WINDOW = new InjectionToken<Window>('Global window object', {
  factory: (): Window => {
    const { defaultView } = inject(DOCUMENT);
    if (!defaultView) {
      throw new Error('Window is not available');
    }
    return defaultView;
  },
});
