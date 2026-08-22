import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { FullCategory } from '../../models/category';
import { RecipeIndexCategoryImages } from './recipe-index-category-images';

describe('RecipeIndexCategoryImages', () => {
  let component: RecipeIndexCategoryImages;
  let fixture: ComponentFixture<RecipeIndexCategoryImages>;

  const mockCategories: FullCategory[] = [
    { name: 'Appetizers', image: '/test1.png', url: '/recipes/appetizers' },
    { name: 'Desserts', image: '/test2.png', url: '/recipes/desserts' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeIndexCategoryImages],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndexCategoryImages);
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
    const icon = searchField?.querySelector('mat-icon');
    const input = searchField?.querySelector('input');

    expect(searchField).toBeTruthy();
    expect(icon?.textContent?.trim()).toBe('search');
    expect(input?.getAttribute('placeholder')).toBe('e.g. Chocolate Cake');
  });

  it('should update search control value when typing', () => {
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputElement.value = 'Chocolate';
    inputElement.dispatchEvent(new Event('input'));

    expect(component.searchControl.value).toBe('Chocolate');
  });

  it('should navigate to search on valid query', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    component.searchControl.setValue('  Chocolate  ');
    component.search();
    expect(router.navigate).toHaveBeenCalledWith(['/search'], { queryParams: { q: 'Chocolate' } });
  });

  it('should not navigate on empty query', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    component.searchControl.setValue('   ');
    component.search();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
