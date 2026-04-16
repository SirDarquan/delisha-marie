import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { WINDOW } from './global-tokens';
import { describe, it, expect } from 'vitest';

describe('WINDOW token', () => {
  it('should return the window object', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: window } }],
    });

    const win = TestBed.inject(WINDOW);
    expect(win).toBe(window);
  });

  it('should throw an error if defaultView is missing', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });

    expect(() => TestBed.inject(WINDOW)).toThrow('Window is not available');
  });
});
