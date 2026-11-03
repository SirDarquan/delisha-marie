import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RecipeIndexLinkList } from './recipe-index-link-list';

describe('RecipeIndexLinkList', () => {
  let component: RecipeIndexLinkList;
  let fixture: ComponentFixture<RecipeIndexLinkList>;

  const mockItems = [
    {
      name: 'Zebra Cakes',
      url: '/recipes/zebra',
      children: [{ name: 'Icing', url: '/recipes/zebra/icing' }],
    },
    {
      name: 'Apple Pie',
      url: '/recipes/apple',
      children: [],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeIndexLinkList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndexLinkList);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('items', mockItems);
    fixture.componentRef.setInput('titlePrefix', 'Test');
    fixture.componentRef.setInput('titleHighlight', 'Links');
    fixture.componentRef.setInput('titleId', 'test-title-id');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort items alphabetically by name', () => {
    const sorted = component.sortedItems();
    expect(sorted[0].name).toBe('Apple Pie');
    expect(sorted[1].name).toBe('Zebra Cakes');
  });

  it('should render the title correctly', () => {
    const titleEl = fixture.debugElement.query(By.css('h2')).nativeElement;
    expect(titleEl.textContent).toContain('Test');
    expect(titleEl.textContent).toContain('Links');
    expect(titleEl.id).toBe('test-title-id');
  });

  it('should render parent items as links', () => {
    const parentLinks = fixture.debugElement.queryAll(By.css('a.text-xl'));
    expect(parentLinks).toHaveLength(2);
    // After sorting, Apple Pie is first
    expect(parentLinks[0].nativeElement.textContent.trim()).toBe('Apple Pie');
    expect(parentLinks[1].nativeElement.textContent.trim()).toBe('Zebra Cakes');
  });

  it('should render children when present', () => {
    const childrenLinks = fixture.debugElement.queryAll(By.css('ul li a'));
    expect(childrenLinks).toHaveLength(1);
    expect(childrenLinks[0].nativeElement.textContent.trim()).toBe('Icing');
  });

  it('should respect the aria-labelledby attribute', () => {
    const section = fixture.debugElement.query(By.css('section')).nativeElement;
    expect(section.getAttribute('aria-labelledby')).toBe('test-title-id');
  });
});
