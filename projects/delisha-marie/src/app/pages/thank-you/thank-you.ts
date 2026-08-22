import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { PageLayout } from '../../components/page-layout/page-layout';
import { FavoriteThings } from '../../components/favorite-things/favorite-things';

@Component({
  selector: 'dm-thank-you',
  imports: [PageLayout, FavoriteThings],
  template: `
    <dm-page-layout slug="thank-you">
      <dm-favorite-things />
    </dm-page-layout>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThankYouPage {}
