import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FullCategory } from '../../models/category';
import { CategoryImages } from './category-images';

describe('CategoryImages', () => {
  let component: CategoryImages;
  let fixture: ComponentFixture<CategoryImages>;

  const mockCategories: FullCategory[] = [
    { name: 'Appetizers', image: '/test1.png', url: '/recipes/appetizers' },
    { name: 'Desserts', image: '/test2.png', url: '/recipes/desserts' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryImages],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryImages);
    component = fixture.componentInstance;

    // Set required input
    fixture.componentRef.setInput('categories', mockCategories);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct number of categories', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('nav[aria-label="Recipe categories"] a');
    expect(links).toHaveLength(2);
  });

  it('should have correct ARIA labels for category links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('nav[aria-label="Recipe categories"] a');
    expect(links[0].getAttribute('aria-label')).toBe('Browse Appetizers');
    expect(links[1].getAttribute('aria-label')).toBe('Browse Desserts');
  });

  it('should render the search input with prefix icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const searchField = compiled.querySelector('mat-form-field');
    expect(searchField).toBeTruthy();
    const icon = searchField?.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('search');
    const input = searchField?.querySelector('input');
    expect(input?.getAttribute('placeholder')).toBe('e.g. Chocolate Cake');
  });

  it('should not render anything if categories array is empty', () => {
    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section).toBeNull();
  });

  it('should navigate to search route when search is triggered with a value', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(() => Promise.resolve(true));

    component.searchControl.setValue('Pasta');
    component.search();

    expect(navigateSpy).toHaveBeenCalledWith(['/'], { queryParams: { q: 'Pasta' } });
  });

  it('should not navigate when search is triggered with whitespace or empty query', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.searchControl.setValue('   ');
    component.search();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should trigger search when pressing Enter on input or clicking Search button', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(() => Promise.resolve(true));

    component.searchControl.setValue('Soup');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/'], { queryParams: { q: 'Soup' } });
  });
});
