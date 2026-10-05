import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundPage } from './not-found';
import { By } from '@angular/platform-browser';

describe('NotFoundPage', () => {
  let component: NotFoundPage;
  let fixture: ComponentFixture<NotFoundPage>;
  let titleService: Title;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideRouter([])],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    vi.spyOn(titleService, 'setTitle');

    fixture = TestBed.createComponent(NotFoundPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 404 title, cooking pot SVG illustration, and description with default "page" wording', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-colored-header')).toBeTruthy();
    expect(compiled.querySelector('.cooking-pot-svg')).toBeTruthy();
    expect(compiled.querySelector('.spoon-group')).toBeTruthy();
    expect(compiled.querySelector('.seasoning-cascade')).toBeTruthy();
    expect(compiled.textContent).toContain('Error 404 • Missing Page');
    expect(compiled.textContent).toContain(
      "Something is simmering, but this page isn't on the menu!",
    );
    expect(component.resolvedNoun()).toBe('page');
    expect(component.resolvedLabel()).toBe('Page');
    expect(component.resolvedTitle()).toBe('Page Not Found');
    expect(titleService.setTitle).toHaveBeenCalledWith("Page Not Found | Delisha Marie's Kitchen");
  });

  it('should dynamically adapt when itemType input is set to "recipe"', () => {
    fixture.componentRef.setInput('itemType', 'recipe');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(component.resolvedNoun()).toBe('recipe');
    expect(component.resolvedLabel()).toBe('Recipe');
    expect(component.resolvedTitle()).toBe('Recipe Not Found');
    expect(compiled.textContent).toContain('Error 404 • Missing Recipe');
    expect(compiled.textContent).toContain(
      "Something is simmering, but this recipe isn't on the menu!",
    );
    expect(compiled.textContent).toContain(
      'The recipe you are looking for may have been whisked away',
    );
    expect(titleService.setTitle).toHaveBeenCalledWith(
      "Recipe Not Found | Delisha Marie's Kitchen",
    );
  });

  it('should deduce noun from custom title input', () => {
    fixture.componentRef.setInput('title', 'Cocktail Not Found');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(component.resolvedNoun()).toBe('cocktail');
    expect(component.resolvedTitle()).toBe('Cocktail Not Found');
    expect(compiled.textContent).toContain('Error 404 • Missing Cocktail');
    expect(compiled.textContent).toContain(
      "Something is simmering, but this cocktail isn't on the menu!",
    );
    expect(titleService.setTitle).toHaveBeenCalledWith(
      "Cocktail Not Found | Delisha Marie's Kitchen",
    );
  });

  it('should resolve title and noun from route snapshot data', async () => {
    const customFixture = TestBed.createComponent(NotFoundPage);
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot as { data: Record<string, unknown> }).data = {
      itemType: 'tag',
      title: 'Tag Not Found',
    };

    customFixture.detectChanges();
    expect(customFixture.componentInstance.resolvedNoun()).toBe('tag');
    expect(customFixture.componentInstance.resolvedTitle()).toBe('Tag Not Found');
    expect(customFixture.nativeElement.textContent).toContain('Error 404 • Missing Tag');
    expect(customFixture.nativeElement.textContent).toContain(
      "Something is simmering, but this tag isn't on the menu!",
    );
  });

  it('should resolve title and noun from query params', () => {
    const route = TestBed.inject(ActivatedRoute);
    Object.defineProperty(route.snapshot, 'queryParamMap', {
      value: convertToParamMap({ title: 'Recipe Not Found' }),
      configurable: true,
    });

    const customFixture = TestBed.createComponent(NotFoundPage);
    customFixture.detectChanges();
    expect(customFixture.componentInstance.resolvedNoun()).toBe('recipe');
    expect(customFixture.componentInstance.resolvedTitle()).toBe('Recipe Not Found');
    expect(customFixture.nativeElement.textContent).toContain('Error 404 • Missing Recipe');
  });

  it('should resolve noun from URL path heuristics when url matches recipe, tag, or collection', () => {
    const router = TestBed.inject(Router);

    Object.defineProperty(router, 'url', { value: '/recipe/smoked-chicken', configurable: true });
    const recipeFixture = TestBed.createComponent(NotFoundPage);
    recipeFixture.detectChanges();
    expect(recipeFixture.componentInstance.resolvedNoun()).toBe('recipe');
    expect(recipeFixture.componentInstance.resolvedTitle()).toBe('Recipe Not Found');

    Object.defineProperty(router, 'url', { value: '/tag/holiday', configurable: true });
    const tagFixture = TestBed.createComponent(NotFoundPage);
    tagFixture.detectChanges();
    expect(tagFixture.componentInstance.resolvedNoun()).toBe('tag');
    expect(tagFixture.componentInstance.resolvedTitle()).toBe('Tag Not Found');

    Object.defineProperty(router, 'url', { value: '/recipes/southern', configurable: true });
    const collectionFixture = TestBed.createComponent(NotFoundPage);
    collectionFixture.detectChanges();
    expect(collectionFixture.componentInstance.resolvedNoun()).toBe('collection');
    expect(collectionFixture.componentInstance.resolvedTitle()).toBe('Collection Not Found');

    Object.defineProperty(router, 'url', { value: '/search', configurable: true });
    const searchFixture = TestBed.createComponent(NotFoundPage);
    searchFixture.detectChanges();
    expect(searchFixture.componentInstance.resolvedNoun()).toBe('search result');
    expect(searchFixture.componentInstance.resolvedTitle()).toBe('Search Result Not Found');
  });

  it('should render navigation links to Home, Recipe Index, and Search', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a[routerLink]');
    expect(links.length).toBeGreaterThanOrEqual(3);

    const hrefs = Array.from(links).map(
      (l) => l.getAttribute('routerLink') || l.getAttribute('href'),
    );
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/recipe-index');
    expect(hrefs).toContain('/search');
  });

  it('should trigger addSeasoning on card click and update message', () => {
    expect(component.userSeasoningBursts()).toBe(0);
    expect(component.seasoningMessage()).toContain('Simmering to perfection');

    const card = fixture.debugElement.query(By.css('.pot-illustration-card'));
    card.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.userSeasoningBursts()).toBe(1);
    expect(component.seasoningMessage()).toBe('A pinch of sea salt added!');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.extra-seasoning-cascade')).toBeTruthy();
  });

  it('should handle keyboard Enter and Space events to add seasoning', () => {
    const card = fixture.debugElement.query(By.css('.pot-illustration-card'));

    card.triggerEventHandler('keydown.enter', null);
    fixture.detectChanges();
    expect(component.userSeasoningBursts()).toBe(1);

    card.triggerEventHandler('keydown.space', null);
    fixture.detectChanges();
    expect(component.userSeasoningBursts()).toBe(2);
    expect(component.seasoningMessage()).toBe('A dash of smoked paprika tossed in!');
  });

  it('should cycle through messages and cap at chef approved message when clicked multiple times', () => {
    for (let i = 0; i < 10; i++) {
      component.addSeasoning();
    }
    fixture.detectChanges();

    expect(component.userSeasoningBursts()).toBe(10);
    expect(component.seasoningMessage()).toContain(
      'Chef Delisha approves this flavorful creation!',
    );
  });
});
