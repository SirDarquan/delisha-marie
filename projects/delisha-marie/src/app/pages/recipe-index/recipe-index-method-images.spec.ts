import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndexMethodImages } from './recipe-index-method-images';
import { provideRouter } from '@angular/router';
import { FullCategory } from '../../models/category';

describe('RecipeIndexMethodImages', () => {
  let component: RecipeIndexMethodImages;
  let fixture: ComponentFixture<RecipeIndexMethodImages>;

  const mockMethods: FullCategory[] = [
    { name: 'Air Fryer', image: '/air.png', url: '/methods/air-fryer' },
    { name: 'Baked', image: '/baked.png', url: '/methods/baked' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeIndexMethodImages],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndexMethodImages);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('methods', mockMethods);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the methods title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#methods-title')?.textContent).toContain('Cooking Methods');
  });

  it('should render all provided methods', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Air Fryer');
    expect(links[1].textContent).toContain('Baked');
  });

  it('should have correct router links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links[0].getAttribute('href')).toBe('/methods/air-fryer');
    expect(links[1].getAttribute('href')).toBe('/methods/baked');
  });

  it('should apply the correct grid classes for layout', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const grid = compiled.querySelector('.grid');
    expect(grid?.classList.contains('grid-cols-1')).toBe(true);
    expect(grid?.classList.contains('md:grid-cols-2')).toBe(true);
    expect(grid?.classList.contains('lg:grid-cols-3')).toBe(true);
  });
});
