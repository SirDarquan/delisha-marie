import { TestBed } from '@angular/core/testing';
import { About } from './about';
import { describe, it, expect, beforeEach } from 'vitest';

describe('About', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [About],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(About);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the personal story', () => {
    const fixture = TestBed.createComponent(About);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Delisha Marie');
    expect(compiled.textContent).toContain('culinary adventures');
  });
});
