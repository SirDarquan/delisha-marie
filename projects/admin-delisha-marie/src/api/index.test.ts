import { describe, it, expect } from 'vitest';
import apiRouter from './index';

describe('API Index Router', () => {
  it('should export an Express router', () => {
    expect(apiRouter).toBeDefined();
    // In Express 5, router is a function
    expect(typeof apiRouter).toBe('function');
  });
});
