import { inject, Injectable, Provider, Type } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export function provideTitleStrategy(strategy: Type<TitleStrategy>): Provider {
  return { provide: TitleStrategy, useClass: strategy };
}

@Injectable({ providedIn: 'root' })
export class TemplatePageTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.titleService.setTitle(`${title} | Delisha Marie`);
    } else {
      this.titleService.setTitle('Delisha Marie | Food Blog');
    }
  }
}
