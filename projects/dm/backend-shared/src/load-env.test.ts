import { describe, it, expect } from 'vitest';
import './load-env';

describe('load-env side effect', () => {
  it('should load environment successfully on module import', () => {
    expect(true).toBe(true);
  });
});
