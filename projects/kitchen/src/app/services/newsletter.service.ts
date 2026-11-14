import { inject, Service } from '@angular/core';
import { Api } from './api';

@Service()
export class NewsletterService {
  private readonly api = inject(Api);

  async subscribe(email: string, provider = 'sender'): Promise<void> {
    return this.api.post('/subscriber', { email, automation: true, provider });
  }
}
