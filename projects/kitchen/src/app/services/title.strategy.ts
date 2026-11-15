import { inject, Provider, Type, Service } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export function provideTitleStrategy(strategy: Type<TitleStrategy>): Provider {
  return { provide: TitleStrategy, useClass: strategy };
}

@Service()
export class TemplatePageTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);

  override updateTitle(routerState: RouterStateSnapshot) {
    let title = this.buildTitle(routerState);
    if (title === undefined || title === '') {
      title = 'From my table to yours';
    }

    this.titleService.setTitle(`${title} | Delisha Marie's Kitchen`);
  }
}
