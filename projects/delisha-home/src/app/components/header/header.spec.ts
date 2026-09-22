import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
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

  it('should render single navigation link for Kitchen', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('nav a');
    expect(navLinks.length).toBe(1);
    expect(navLinks[0].textContent).toContain('Kitchen');
    expect(navLinks[0].getAttribute('href')).toBe(component.kitchenUrl);
    expect(component.kitchenUrl).toContain('/kitchen');
  });
});
