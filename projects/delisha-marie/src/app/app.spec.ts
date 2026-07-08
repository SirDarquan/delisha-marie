import { ViewportScroller } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Scroll, Event, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { App } from './app';
import { ThemeService } from './services/theme.service';

describe('App', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: '**', component: App }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ThemeService,
          useValue: { isDark: signal(false), toggle: vi.fn() },
        },
        {
          provide: GoogleTagManagerService,
          useValue: {
            addGtmToDom: vi.fn().mockResolvedValue(undefined),
            pushTag: vi.fn().mockResolvedValue(undefined),
          },
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
    const mockScrollEvent = new Scroll(null as unknown as NavigationEnd, [10, 20], null);
    (router.events as Subject<Event>).next(mockScrollEvent);

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
    const mockScrollEvent = new Scroll(null as unknown as NavigationEnd, null, 'target-anchor');
    (router.events as Subject<Event>).next(mockScrollEvent);

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
    const mockScrollEvent = new Scroll(null as unknown as NavigationEnd, null, null);
    (router.events as Subject<Event>).next(mockScrollEvent);

    // Run effects
    fixture.detectChanges();

    expect(posSpy).not.toHaveBeenCalled();
    expect(anchorSpy).not.toHaveBeenCalled();
  });

  it('should set isPrintPage to true if router.url includes /print', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const app = fixture.componentInstance;

    // Simulate router url and NavigationEnd
    const urlSpy = vi.spyOn(router, 'url', 'get').mockReturnValue('/recipe/my-recipe/print');
    const mockNavEvent = new NavigationEnd(1, '/recipe/my-recipe/print', '/recipe/my-recipe/print');
    (router.events as Subject<Event>).next(mockNavEvent);

    expect(app.isPrintPage()).toBe(true);

    // Simulate router url without /print
    urlSpy.mockReturnValue('/recipe/my-recipe');
    const mockNavEvent2 = new NavigationEnd(2, '/recipe/my-recipe', '/recipe/my-recipe');
    (router.events as Subject<Event>).next(mockNavEvent2);

    expect(app.isPrintPage()).toBe(false);
  });
});
