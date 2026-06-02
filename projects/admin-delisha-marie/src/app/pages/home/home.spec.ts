import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { HomeComponent } from './home';
import { RecipeService } from '../../services/recipe.service';
import { signal } from '@angular/core';

interface MockRecipeService {
  recipes: unknown;
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  let fakeRecipeService: MockRecipeService;
  const fakeRecipes = signal<unknown[]>([]);

  beforeEach(async () => {
    fakeRecipes.set([]);

    fakeRecipeService = {
      recipes: fakeRecipes,
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: RecipeService, useValue: fakeRecipeService }],
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

  it('should display 0 as total recipes when recipe list is empty', () => {
    expect(component.totalRecipes()).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    const totalCountText = compiled.querySelector('main p')?.textContent;
    expect(totalCountText).toBe('0');
  });

  it('should list the recent recipes in reversed order and limited to 3', () => {
    const mockList = [
      { id: '1', title: 'Recipe One', category: 'Dinner', prepTime: '10m', author: 'Chef A' },
      { id: '2', title: 'Recipe Two', category: 'Breakfast', prepTime: '15m', author: 'Chef B' },
      { id: '3', title: 'Recipe Three', category: 'Lunch', prepTime: '20m', author: 'Chef C' },
      { id: '4', title: 'Recipe Four', category: 'Dessert', prepTime: '25m', author: 'Chef D' },
    ];
    fakeRecipes.set(mockList);
    fixture.detectChanges();

    expect(component.totalRecipes()).toBe(4);
    const recent = component.recentRecipes();
    expect(recent.length).toBe(3);
    // last element is sliced and reversed, so first should be 'Recipe Four' (id: '4')
    expect(recent[0].id).toBe('4');
    expect(recent[1].id).toBe('3');
    expect(recent[2].id).toBe('2');
  });

  it('should fallback to Chef when author is missing or falsy', () => {
    const mockList = [
      { id: '1', title: 'Recipe One', category: 'Dinner', prepTime: '10m', author: '' },
    ];
    fakeRecipes.set(mockList);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const authorText = compiled.querySelector('p.text-slate-400')?.textContent;
    expect(authorText).toBe('By Chef');
  });
});
