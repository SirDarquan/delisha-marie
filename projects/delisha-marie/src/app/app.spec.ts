import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Router, Scroll } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ThemeService } from './services/theme.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ViewportScroller } from '@angular/common';
import { Subject } from 'rxjs';

describe('App', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ThemeService,
          useValue: { isDark: signal(false), toggle: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    fixture.detectChanges();
  });

  it('should handle router scroll events with position', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const scroller = TestBed.inject(ViewportScroller);
    const scrollSpy = vi.spyOn(scroller, 'scrollToPosition');

    fixture.detectChanges(); // Trigger effect

    // Emit scroll event with position
    const mockScrollEvent = new Scroll(null as any, [10, 20], null);
    (router.events as Subject<any>).next(mockScrollEvent);

    // Run effects
    fixture.detectChanges();

    expect(scrollSpy).toHaveBeenCalledWith([10, 20]);
  });

  it('should handle router scroll events with anchor', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const scroller = TestBed.inject(ViewportScroller);
    const scrollSpy = vi.spyOn(scroller, 'scrollToAnchor');

    fixture.detectChanges(); // Trigger effect

    // Emit scroll event with anchor
    const mockScrollEvent = new Scroll(null as any, null, 'target-anchor');
    (router.events as Subject<any>).next(mockScrollEvent);

    // Run effects
    fixture.detectChanges();

    expect(scrollSpy).toHaveBeenCalledWith('target-anchor');
  });

  it('should do nothing on scroll events without position or anchor', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const scroller = TestBed.inject(ViewportScroller);
    const posSpy = vi.spyOn(scroller, 'scrollToPosition');
    const anchorSpy = vi.spyOn(scroller, 'scrollToAnchor');

    fixture.detectChanges(); // Trigger effect

    // Emit scroll event with neither position nor anchor
    const mockScrollEvent = new Scroll(null as any, null, null);
    (router.events as Subject<any>).next(mockScrollEvent);

    // Run effects
    fixture.detectChanges();

    expect(posSpy).not.toHaveBeenCalled();
    expect(anchorSpy).not.toHaveBeenCalled();
  });
});
