import { describe, expect, it, vi } from 'vitest';
import robotsTxtMiddleware from './robots-txt.middleware';

describe('robotsTxtMiddleware', () => {
  it('should call next() for non-robots.txt requests', () => {
    const req = { url: '/about' } as any;
    const res = { setHeader: vi.fn(), end: vi.fn() } as any;
    const next = vi.fn();

    robotsTxtMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.end).not.toHaveBeenCalled();
  });

  it('should call next() when req.url is undefined', () => {
    const req = {} as any;
    const res = { setHeader: vi.fn(), end: vi.fn() } as any;
    const next = vi.fn();

    robotsTxtMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should serve robots.txt for /robots.txt request', () => {
    const req = { url: '/robots.txt?test=1' } as any;
    const res = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: vi.fn(),
    } as any;
    const next = vi.fn();

    robotsTxtMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('User-agent:'));
  });
});
