import { describe, expect, it } from 'vitest';
import './load-env';

describe('load-env side effect', () => {
  it('should load environment successfully on module import', () => {
    expect(typeof process.env['NODE_ENV']).toBe('string');
  });
});
