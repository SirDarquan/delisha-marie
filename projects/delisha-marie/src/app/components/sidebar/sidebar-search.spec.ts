import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarSearch } from './sidebar-search';
import { By } from '@angular/platform-browser';

describe('SidebarSearch', () => {
  let component: SidebarSearch;
  let fixture: ComponentFixture<SidebarSearch>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarSearch],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarSearch);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an empty search control initially', () => {
    expect(component.searchControl.value).toBe('');
  });

  it('should navigate to recipe index with search query on search()', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.searchControl.setValue('Chicken');
    component.search();

    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'Chicken' },
    });
  });

  it('should trigger search on enter key', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.searchControl.setValue('Pasta');

    const input = fixture.nativeElement.querySelector('input');
    const event = new KeyboardEvent('keyup', { key: 'Enter' });
    input.dispatchEvent(event);

    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'Pasta' },
    });
  });

  it('should not navigate if search query is empty', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.searchControl.setValue('');
    component.search();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should trigger search on button click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.searchControl.setValue('Salad');

    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'Salad' },
    });
  });
});
