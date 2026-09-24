import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the home page', () => {
    expect(component).toBeTruthy();
  });

  it('should render full-screen hero image of Delisha Marie', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('section img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/delisha-marie.jpg');
    expect(img?.getAttribute('alt')).toContain('Delisha Marie');
    expect(img?.classList.contains('hero-image')).toBe(true);
  });

  it('should render the image inside a hero section landmark', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section.hero-section');
    expect(section).toBeTruthy();
    expect(section?.getAttribute('aria-label')).toBe('Delisha Marie Portrait');
  });
});
