import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { PageLayout } from '../../components/page-layout/page-layout';
import { ContactForm } from '../../components/contact-form/contact-form';

@Component({
  selector: 'dm-contact',
  imports: [PageLayout, ContactForm],
  template: `
    <dm-page-layout slug="contact">
      <dm-contact-form />
    </dm-page-layout>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {}
