import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndexCategoryImages } from './recipe-index-category-images';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { FullCategory } from '../../models/category';

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
    expect(links.length).toBe(2);
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
});
