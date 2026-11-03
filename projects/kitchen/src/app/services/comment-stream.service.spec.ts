import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentStreamService } from './comment-stream.service';

describe('CommentStreamService', () => {
  let service: CommentStreamService;
  let originalEventSource: typeof EventSource;

  class MockEventSource {
    static instances: MockEventSource[] = [];
    url: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    close = vi.fn();

    constructor(url: string) {
      this.url = url;
      MockEventSource.instances.push(this);
    }
  }

  beforeEach(() => {
    MockEventSource.instances = [];
    originalEventSource = globalThis.EventSource;
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource;

    TestBed.configureTestingModule({
      providers: [CommentStreamService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(CommentStreamService);
  });

  afterEach(() => {
    globalThis.EventSource = originalEventSource;
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should connect to correct URL and receive message events', () => {
    let received: unknown;
    const sub = service.getCommentStream(123).subscribe((data) => {
      received = data;
    });

    expect(MockEventSource.instances).toHaveLength(1);
    const instance = MockEventSource.instances[0];
    expect(instance.url).toBe('/api/recipes/123/comments/stream');

    // Trigger onmessage with valid json
    const payload = { comment: { id: 'stream-1', content: 'hello' } };
    instance.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);

    expect(received).toEqual(payload);

    // Unsubscribe closes EventSource
    sub.unsubscribe();
    expect(instance.close).toHaveBeenCalled();
  });

  it('should ignore unparseable json frames in onmessage', () => {
    const nextFn = vi.fn();
    const sub = service.getCommentStream('1').subscribe({ next: nextFn });

    const instance = MockEventSource.instances[0];
    instance.onmessage?.({ data: 'invalid-json' } as MessageEvent);
    expect(nextFn).not.toHaveBeenCalled();

    sub.unsubscribe();
  });

  it('should propagate errors from onerror', () => {
    let receivedError: unknown;
    const sub = service.getCommentStream('1').subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    const instance = MockEventSource.instances[0];
    const errorEvent = new Event('error');
    instance.onerror?.(errorEvent);

    expect(receivedError).toBe(errorEvent);
    sub.unsubscribe();
  });

  it('should catch synchronous EventSource construction errors', () => {
    class FailingEventSource {
      constructor() {
        throw new Error('Blocked by CSP');
      }
    }
    globalThis.EventSource = FailingEventSource as unknown as typeof EventSource;

    let receivedError: Error | undefined;
    service.getCommentStream('1').subscribe({
      error: (err: Error) => {
        receivedError = err;
      },
    });

    expect(receivedError?.message).toBe('Blocked by CSP');
  });

  it('should return EMPTY when EventSource is not defined on the window', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).EventSource;

    let emitted = false;
    let completed = false;
    service.getCommentStream('1').subscribe({
      next: () => (emitted = true),
      complete: () => (completed = true),
    });

    expect(emitted).toBe(false);
    expect(completed).toBe(true);
  });

  it('should return EMPTY when running on server (SSR)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CommentStreamService, { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const ssrService = TestBed.inject(CommentStreamService);

    let emitted = false;
    let completed = false;
    ssrService.getCommentStream('1').subscribe({
      next: () => (emitted = true),
      complete: () => (completed = true),
    });

    expect(emitted).toBe(false);
    expect(completed).toBe(true);
  });
});
