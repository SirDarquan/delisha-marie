import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeIndex } from './recipe-index';

describe('RecipeIndex', () => {
  let component: RecipeIndex;
  let fixture: ComponentFixture<RecipeIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeIndex],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Recipe Index title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Recipe');
    expect(compiled.querySelector('h1')?.textContent).toContain('Index');
  });

  it('should render the placeholders grid', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('mat-card');
    expect(cards.length).toBe(6);
  });
});
