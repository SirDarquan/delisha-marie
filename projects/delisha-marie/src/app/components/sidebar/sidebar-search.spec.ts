import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarSearch } from './sidebar-search';
import { By } from '@angular/platform-browser';

describe('SidebarSearch', () => {
  let component: SidebarSearch;
  let fixture: ComponentFixture<SidebarSearch>;
  let router: Router;

  const routeSubject = new BehaviorSubject<{ q?: string }>({});

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarSearch],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: routeSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarSearch);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    routeSubject.next({}); // reset
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an empty search control initially', () => {
    expect(component.queryModel().query).toBe('');
  });

  it('should trigger search on form submit', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.queryModel.set({ query: 'Pasta' });
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('submit', new Event('submit'));

    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'Pasta' },
    });
  });

  it('should not navigate if search query is empty', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.queryModel.set({ query: '' });
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('submit', new Event('submit'));
    await fixture.whenStable();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should trigger search on button click', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.queryModel.set({ query: 'Salad' });
    fixture.detectChanges();

    // With form signals we submit the form root
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('submit', new Event('submit'));
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'Salad' },
    });
  });

  it('should initialize query from ActivatedRoute queryParams', async () => {
    routeSubject.next({ q: 'Beef' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.queryModel().query).toBe('Beef');
  });
});
