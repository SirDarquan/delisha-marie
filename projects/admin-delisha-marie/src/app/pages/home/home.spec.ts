import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { HomeComponent } from './home';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create the home component', () => {
    expect(component).toBeTruthy();
  });

  it('should default user welcome text to Admin when no user is logged in', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const welcomeText = compiled
      .querySelector('header p')
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();
    expect(welcomeText).toBe('Welcome back, Admin !');
  });

  it('should display 0 as total recipes when recipe list is empty', () => {
    expect(component.totalRecipes()).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    const totalCountText = compiled.querySelector('main p')?.textContent;
    expect(totalCountText).toBe('0');
  });
});
