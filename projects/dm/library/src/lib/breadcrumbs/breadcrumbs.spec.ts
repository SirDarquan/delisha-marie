import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BreadcrumbItem, Breadcrumbs } from './breadcrumbs';

@Component({
  template: `<dml-breadcrumbs [items]="items" />`,
  imports: [Breadcrumbs],
})
class TestHostComponent {
  items: BreadcrumbItem[] = [];
}

describe('Breadcrumbs', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  it('should render items without links correctly', () => {
    hostComponent.items = [{ label: 'Home' }, { label: 'Category' }, { label: 'Recipe' }];
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('li'));
    expect(items.length).toBe(3);

    const links = fixture.debugElement.queryAll(By.css('a'));
    expect(links.length).toBe(0);

    const labels = items.map((item) => item.nativeElement.textContent.trim());
    expect(labels[0]).toContain('Home');
    expect(labels[1]).toContain('Category');
    expect(labels[2]).toContain('Recipe');
  });

  it('should render links for items with urls except the last item', () => {
    hostComponent.items = [
      { label: 'Home', url: '/' },
      { label: 'Category', url: '/recipes/category' },
      { label: 'Recipe', url: '/recipes/category/recipe' },
    ];
    fixture.detectChanges();

    const links = fixture.debugElement.queryAll(By.css('a'));
    expect(links.length).toBe(2);

    expect(links[0].nativeElement.textContent.trim()).toBe('Home');
    expect(links[0].nativeElement.getAttribute('href')).toBe('/');

    expect(links[1].nativeElement.textContent.trim()).toBe('Category');
    expect(links[1].nativeElement.getAttribute('href')).toBe('/recipes/category');

    const lastItem = fixture.debugElement.queryAll(By.css('li'))[2];
    const lastSpan = lastItem.query(By.css('span'));
    expect(lastSpan.nativeElement.textContent.trim()).toBe('Recipe');
  });

  it('should render separators between items', () => {
    hostComponent.items = [{ label: 'Home', url: '/' }, { label: 'Recipe' }];
    fixture.detectChanges();

    const icons = fixture.debugElement.queryAll(By.css('mat-icon'));
    expect(icons.length).toBe(1);
    expect(icons[0].nativeElement.textContent.trim()).toBe('chevron_right');
  });

  it('should have proper accessibility attributes', () => {
    fixture.detectChanges();
    const nav = fixture.debugElement.query(By.css('nav'));
    expect(nav.nativeElement.getAttribute('aria-label')).toBe('Breadcrumb');
  });
});
