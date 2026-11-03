import { inject, Injectable } from '@angular/core';
import { Api } from './api';

@Injectable({
  providedIn: 'root',
})
export class NewsletterService {
  private readonly api = inject(Api);

  async subscribe(email: string, provider = 'sender'): Promise<void> {
    return this.api.post('/subscriber', { email, automation: true, provider });
  }
}
