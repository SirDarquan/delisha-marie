import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should render header and footer', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-header')).toBeTruthy();
    expect(compiled.querySelector('dm-footer')).toBeTruthy();
  });

  it('should render full-screen hero image of Delisha Marie', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('main img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/delisha-marie.jpg');
    expect(img?.getAttribute('alt')).toContain('Delisha Marie');
    expect(img?.classList.contains('object-cover')).toBe(true);
  });
});
