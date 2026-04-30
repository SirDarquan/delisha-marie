import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeHero } from './recipe-hero';
import { Recipe } from '../../services/recipe.service';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

describe('RecipeHero', () => {
  let component: RecipeHero;
  let fixture: ComponentFixture<RecipeHero>;

  const mockRecipe: Recipe = {
    id: '1',
    title: 'Test Recipe',
    slug: 'test-recipe',
    description: 'A delicious test recipe.',
    image: 'test.jpg',
    prepTime: '10 min',
    cookTime: '20 min',
    difficulty: 'Easy',
    totalTime: '30 min',
    author: 'Delisha Marie',
    servings: '4',
    ingredients: ['Ingredient 1'],
    instructions: ['Step 1'],
    course: 'Main',
    cuisine: 'American',
    category: 'Test Category',
    keywords: ['test'],
    nutrition: {
      calories: '200',
      fat: '10g',
      carbohydrates: '20g',
      protein: '5g',
      saturatedFat: '2g',
      cholesterol: '10mg',
      sodium: '100mg',
      fiber: '2g',
      sugar: '10g',
      servingSize: '1 serving',
    },
    theBest: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeHero],
      providers: [
        {
          provide: IMAGE_LOADER,
          useValue: (config: ImageLoaderConfig) => config.src,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeHero);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the recipe title', () => {
    const titleElement = fixture.nativeElement.querySelector('h1');
    expect(titleElement.textContent).toContain(mockRecipe.title);
  });

  it('should display the description', () => {
    const descElement = fixture.nativeElement.querySelector('.hero-container p');
    expect(descElement.textContent).toContain(mockRecipe.description);
  });

  it('should display the description', () => {
    const descElement = fixture.nativeElement.querySelector('.hero-container p');
    expect(descElement.textContent).toContain(mockRecipe.description);
  });
});
