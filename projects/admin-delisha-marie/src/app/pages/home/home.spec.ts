import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { vi } from 'vitest';
import { ApiService } from '../../services/api.service';
import { HomeComponent } from './home';

interface HomeData {
  totalRecipes: number;
  recentRecipes: unknown[];
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let fakeApiService: { get: unknown };
  let mockMatDialog: { open: unknown };

  async function createComponent(data: HomeData) {
    fakeApiService = {
      get: vi.fn().mockResolvedValue(data),
    };
    mockMatDialog = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: fakeApiService },
        { provide: MatDialog, useValue: mockMatDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create the home component', async () => {
    await createComponent({ totalRecipes: 0, recentRecipes: [] });
    expect(component).toBeTruthy();
  });

  it('should display 0 as total recipes when recipe list is empty', async () => {
    await createComponent({ totalRecipes: 0, recentRecipes: [] });
    expect(component.totalRecipes()).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    const totalCountText = compiled.querySelector('main p')?.textContent;
    expect(totalCountText).toBe('0');
  });

  it('should list the recent recipes in reversed order and limited to 3', async () => {
    const mockList = [
      { id: '4', title: 'Recipe Four', category: 'Dessert', prepTime: '25m', author: 'Chef D' },
      { id: '3', title: 'Recipe Three', category: 'Lunch', prepTime: '20m', author: 'Chef C' },
      { id: '2', title: 'Recipe Two', category: 'Breakfast', prepTime: '15m', author: 'Chef B' },
    ];
    await createComponent({ totalRecipes: 4, recentRecipes: mockList });

    expect(component.totalRecipes()).toBe(4);
    const recent = component.recentRecipes();
    expect(recent).toHaveLength(3);
    expect(recent[0].id).toBe('4');
    expect(recent[1].id).toBe('3');
    expect(recent[2].id).toBe('2');
  });

  it('should fallback to Chef when author is missing or falsy', async () => {
    const mockList = [
      { id: '1', title: 'Recipe One', category: 'Dinner', prepTime: '10m', author: '' },
    ];
    await createComponent({ totalRecipes: 1, recentRecipes: mockList });

    const compiled = fixture.nativeElement as HTMLElement;
    const authorText = compiled.querySelector('p.text-slate-400')?.textContent;
    expect(authorText).toBe('By Chef');
  });

  it('should open CreateRecipeDialogComponent when Create Recipe button is clicked', async () => {
    await createComponent({ totalRecipes: 0, recentRecipes: [] });
    const compiled = fixture.nativeElement as HTMLElement;
    const createButton = Array.from(compiled.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('+ Create Recipe'),
    );
    createButton?.click();
    expect(mockMatDialog.open).toHaveBeenCalled();
  });
});
