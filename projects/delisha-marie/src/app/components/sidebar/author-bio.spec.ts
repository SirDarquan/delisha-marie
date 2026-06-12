import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthorBio } from './author-bio';

describe('AuthorBio', () => {
  let component: AuthorBio;
  let fixture: ComponentFixture<AuthorBio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorBio],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorBio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render author details', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('img')).toBeTruthy();
    expect(compiled.querySelector('h3')?.textContent).toContain('Delisha');
    expect(compiled.querySelector('p')?.textContent).toBeTruthy();
  });
});
