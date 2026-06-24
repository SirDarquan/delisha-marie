import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { BreadcrumbItem, Breadcrumbs } from './breadcrumbs';

@Component({
  template: `<dml-breadcrumbs [items]="items()" />`,
  standalone: true,
  imports: [Breadcrumbs],
})
class TestHostComponent {
  items = signal<BreadcrumbItem[]>([]);
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

  it('should render multiple breadcrumb items', () => {
    hostComponent.items.set([
      { label: 'Home', url: '/' },
      { label: 'Level 1', url: '/l1' },
      { label: 'Current' },
    ]);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('li'));
    expect(items).toHaveLength(3);

    expect(items[0].nativeElement.textContent).toContain('Home');
    expect(items[1].nativeElement.textContent).toContain('Level 1');
    expect(items[2].nativeElement.textContent).toContain('Current');
  });

  it('should link all items except the last one', () => {
    hostComponent.items.set([{ label: 'Home', url: '/' }, { label: 'Current' }]);
    fixture.detectChanges();

    const links = fixture.debugElement.queryAll(By.css('a'));
    expect(links).toHaveLength(1);
    expect(links[0].nativeElement.textContent).toContain('Home');

    const lastItem = fixture.debugElement.query(By.css('li:last-child span'));
    expect(lastItem).toBeTruthy();
    expect(lastItem.nativeElement.textContent).toContain('Current');
  });

  it('should render separators between items but not after the last one', () => {
    hostComponent.items.set([
      { label: 'Home', url: '/' },
      { label: 'Level 1', url: '/l1' },
      { label: 'Current' },
    ]);
    fixture.detectChanges();

    const icons = fixture.debugElement.queryAll(By.css('mat-icon'));
    expect(icons).toHaveLength(2);
  });
});
