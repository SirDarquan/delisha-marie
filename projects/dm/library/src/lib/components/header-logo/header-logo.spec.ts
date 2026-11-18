import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { HeaderLogo } from './header-logo';

describe('HeaderLogo', () => {
  let fixture: ComponentFixture<HeaderLogo>;
  let component: HeaderLogo;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderLogo],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderLogo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default empty words and root routerLink', () => {
    expect(component).toBeTruthy();
    expect(component.words()).toEqual([]);
    expect(component.routerLink()).toBe('/');
    expect(component.href()).toBeUndefined();

    const compiled = fixture.nativeElement as HTMLElement;
    const anchor = compiled.querySelector('a.logo-container');
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute('href')).toBe('/');
    expect(compiled.querySelectorAll('.logo-word')).toHaveLength(0);
  });

  it('should split words into bold first letter and fading remainder with routerLink', () => {
    fixture.componentRef.setInput('words', ['Delisha', 'Marie', '']);
    fixture.componentRef.setInput('routerLink', '/home');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const anchor = compiled.querySelector('a.logo-container');
    expect(anchor?.getAttribute('href')).toBe('/home');

    const words = compiled.querySelectorAll('.logo-word');
    expect(words).toHaveLength(2);

    expect(words[0].querySelector('.logo-letter-bold')?.textContent).toBe('D');
    expect(words[0].querySelector('.logo-letter-fade')?.textContent).toBe('elisha');

    expect(words[1].querySelector('.logo-letter-bold')?.textContent).toBe('M');
    expect(words[1].querySelector('.logo-letter-fade')?.textContent).toBe('arie');
  });

  it('should render external href anchor when href input is provided', () => {
    fixture.componentRef.setInput('words', ['Delisha', "Marie's", 'Kitchen']);
    fixture.componentRef.setInput('href', 'https://delishamarie.com');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const anchor = compiled.querySelector('a.logo-container');
    expect(anchor?.getAttribute('href')).toBe('https://delishamarie.com');

    const words = compiled.querySelectorAll('.logo-word');
    expect(words).toHaveLength(3);

    expect(words[0].querySelector('.logo-letter-bold')?.textContent).toBe('D');
    expect(words[0].querySelector('.logo-letter-fade')?.textContent).toBe('elisha');

    expect(words[1].querySelector('.logo-letter-bold')?.textContent).toBe('M');
    expect(words[1].querySelector('.logo-letter-fade')?.textContent).toBe("arie's");

    expect(words[2].querySelector('.logo-letter-bold')?.textContent).toBe('K');
    expect(words[2].querySelector('.logo-letter-fade')?.textContent).toBe('itchen');
  });
});
