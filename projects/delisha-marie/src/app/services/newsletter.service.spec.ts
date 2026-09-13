import { TestBed } from '@angular/core/testing';
import { NewsletterService } from './newsletter.service';
import { Api } from './api';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NewsletterService', () => {
  let service: NewsletterService;
  let api: Api;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NewsletterService,
        {
          provide: Api,
          useValue: {
            post: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    service = TestBed.inject(NewsletterService);
    api = TestBed.inject(Api);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call api.post with default provider', async () => {
    await service.subscribe('test@example.com');
    expect(api.post).toHaveBeenCalledWith('/subscriber', {
      email: 'test@example.com',
      automation: true,
      provider: 'sender',
    });
  });

  it('should call api.post with custom provider', async () => {
    await service.subscribe('test@example.com', 'mailchimp');
    expect(api.post).toHaveBeenCalledWith('/subscriber', {
      email: 'test@example.com',
      automation: true,
      provider: 'mailchimp',
    });
  });
});
