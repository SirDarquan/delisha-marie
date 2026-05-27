import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { signal, Component } from '@angular/core';
import { vi } from 'vitest';

@Component({
  selector: 'app-dummy',
  template: '',
})
class DummyComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'login', component: DummyComponent },
          { path: 'signup', component: DummyComponent },
          { path: 'recipes', component: DummyComponent },
          { path: '', component: DummyComponent },
        ]),
        { provide: AuthService, useValue: { currentUser: signal(null), logout: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the title signal set to "admin-delisha-marie"', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['title']()).toBe('admin-delisha-marie');
  });

  it('should control header display reactively based on routing URL', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const router = TestBed.inject(Router);

    // Initial state (on root page)
    fixture.detectChanges();
    expect(app['showHeader']()).toBe(true);

    // Navigate to /login -> showHeader should be false
    await router.navigate(['/login']);
    fixture.detectChanges();
    expect(app['showHeader']()).toBe(false);

    // Navigate to /signup -> showHeader should be false
    await router.navigate(['/signup']);
    fixture.detectChanges();
    expect(app['showHeader']()).toBe(false);

    // Navigate to /recipes -> showHeader should be true
    await router.navigate(['/recipes']);
    fixture.detectChanges();
    expect(app['showHeader']()).toBe(true);
  });

  it('should render the app-header only when showHeader is true', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    // Initial root route
    fixture.detectChanges();
    let headerEl = fixture.nativeElement.querySelector('app-header');
    expect(headerEl).toBeTruthy();

    // Navigate to /login (showHeader is false)
    await router.navigate(['/login']);
    fixture.detectChanges();
    headerEl = fixture.nativeElement.querySelector('app-header');
    expect(headerEl).toBeFalsy();

    // Navigate to /recipes (showHeader is true)
    await router.navigate(['/recipes']);
    fixture.detectChanges();
    headerEl = fixture.nativeElement.querySelector('app-header');
    expect(headerEl).toBeTruthy();
  });
});
