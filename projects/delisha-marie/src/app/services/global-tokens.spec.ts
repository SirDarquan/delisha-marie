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

  it('should have the correct injection token description', () => {
    expect(WINDOW.toString()).toContain('Global window object');
  });

  it('should return the exact same instance provided by the document', () => {
    const mockWindow = { location: {} } as Window;
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: mockWindow } }],
    });

    const win = TestBed.inject(WINDOW);
    expect(win).toBe(mockWindow);
  });

  it('should work correctly within an injection context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: window } }],
    });

    const result = TestBed.runInInjectionContext(() => TestBed.inject(WINDOW));
    expect(result).toBe(window);
  });
});
