import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Delisha Marie logo linking to root', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logoLink = compiled.querySelector('a.logo-container');
    expect(logoLink).toBeTruthy();
    expect(logoLink?.getAttribute('href')).toBe('/');
    expect(logoLink?.textContent).toContain('Delisha');
    expect(logoLink?.textContent).toContain('Marie');
  });

  it('should render navigation links for About, Contact, and Kitchen', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('nav a');
    expect(navLinks).toHaveLength(3);

    // About link
    expect(navLinks[0].textContent).toContain('About');
    expect(navLinks[0].getAttribute('href')).toBe('/about');

    // Contact link
    expect(navLinks[1].textContent).toContain('Contact');
    expect(navLinks[1].getAttribute('href')).toBe('/contact');

    // Kitchen link
    expect(navLinks[2].textContent).toContain('Kitchen');
    expect(navLinks[2].getAttribute('href')).toBe(component.kitchenUrl);
    expect(component.kitchenUrl).toContain('/');
  });
});
