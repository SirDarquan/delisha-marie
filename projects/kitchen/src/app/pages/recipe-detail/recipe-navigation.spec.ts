import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RecipeNavigation } from './recipe-navigation';

describe('RecipeNavigation', () => {
  let component: RecipeNavigation;
  let fixture: ComponentFixture<RecipeNavigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeNavigation],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeNavigation);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show if has next', () => {
    fixture.componentRef.setInput('previous', null);
    fixture.componentRef.setInput('next', { title: 'Next', slug: 'next' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-navigation')).toBeTruthy();
    expect(compiled.textContent).toContain('Next Recipe');
    expect(compiled.textContent).toContain('Next');
  });

  it('should show if has previous', () => {
    fixture.componentRef.setInput('previous', { title: 'Prev', slug: 'prev' });
    fixture.componentRef.setInput('next', null);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recipe-navigation')).toBeTruthy();
    expect(compiled.textContent).toContain('Previous Recipe');
    expect(compiled.textContent).toContain('Prev');
  });

  it('should show both if both are provided', () => {
    fixture.componentRef.setInput('previous', { title: 'Prev', slug: 'prev' });
    fixture.componentRef.setInput('next', { title: 'Next', slug: 'next' });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Prev');
    expect(compiled.textContent).toContain('Next');
  });
});
