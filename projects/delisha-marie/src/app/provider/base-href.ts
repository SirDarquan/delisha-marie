import { APP_BASE_HREF } from '@angular/common';
import { isDevMode } from '@angular/core';

export function provideBaseHref(baseHref: string) {
  if (isDevMode()) {
    return [{ provide: APP_BASE_HREF, useValue: '/' }];
  } else {
    return [{ provide: APP_BASE_HREF, useValue: baseHref }];
  }
}
