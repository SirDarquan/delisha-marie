import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndex } from './recipe-index';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecipeIndexService } from '../../services/recipe-index.service';
import { of } from 'rxjs';

describe('RecipeIndex', () => {
  let component: RecipeIndex;
  let fixture: ComponentFixture<RecipeIndex>;

  beforeEach(async () => {
    const mockCategories = [
      { name: 'Appetizers', image: 'test.png', url: '/test' },
      { name: 'Breakfast', image: 'test.png', url: '/test' },
      { name: 'Main Dishes', image: 'test.png', url: '/test' },
      { name: 'Sides', image: 'test.png', url: '/test' },
      { name: 'Salads', image: 'test.png', url: '/test' },
      { name: 'Soups', image: 'test.png', url: '/test' },
      { name: 'Breads', image: 'test.png', url: '/test' },
      { name: 'Desserts', image: 'test.png', url: '/test' },
    ];

    await TestBed.configureTestingModule({
      imports: [RecipeIndex],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RecipeIndexService,
          useValue: {
            getFeaturedCategories: () => of(mockCategories),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Recipe Index title with Material classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.textContent).toContain('Recipe Index');
    expect(h1?.classList.contains('mat-headline-medium')).toBe(true);
  });

  it('should render 8 category navigation links with ARIA labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const categories = compiled.querySelectorAll('nav[aria-label="Recipe categories"] a');
    expect(categories.length).toBe(8);
    expect(categories[0].getAttribute('aria-label')).toContain('Browse Appetizers');
  });

  it('should render the breadcrumbs with correct items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const breadcrumbs = compiled.querySelector('dml-breadcrumbs');
    expect(breadcrumbs).toBeTruthy();
    expect(breadcrumbs?.textContent).toContain('Home');
    expect(breadcrumbs?.textContent).toContain('Recipe Index');
  });

  it('should render the newsletter section with correct titles', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const newsletter = compiled.querySelector('footer');
    expect(newsletter).toBeTruthy();
    expect(newsletter?.querySelector('h2')?.textContent).toContain('Never miss a beat!');
    expect(newsletter?.querySelector('button')?.textContent).toContain(
      'Join the Studio Newsletter',
    );
  });

  it('should render section headers correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const latestHeading = compiled.querySelector('#latest-title');
    expect(latestHeading?.textContent?.trim()).toBe('Latest');
  });

  it('should display "Coming Soon" badges on latest recipe cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('mat-chip');
    expect(badges.length).toBe(6);
    expect(badges[0].textContent?.trim()).toBe('Coming Soon');
  });
});
