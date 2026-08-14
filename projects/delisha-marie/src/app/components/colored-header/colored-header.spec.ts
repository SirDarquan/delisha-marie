import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ColoredHeaderComponent } from './colored-header';
import { ComponentRef } from '@angular/core';

describe('ColoredHeaderComponent', () => {
  let component: ColoredHeaderComponent;
  let fixture: ComponentFixture<ColoredHeaderComponent>;
  let componentRef: ComponentRef<ColoredHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColoredHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ColoredHeaderComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  describe('formattedTitle', () => {
    it('should handle empty string', () => {
      componentRef.setInput('title', '   ');
      fixture.detectChanges();
      expect(component.formattedTitle()).toEqual({ first: '', last: '' });
    });

    it('should handle single word', () => {
      componentRef.setInput('title', 'Hello');
      fixture.detectChanges();
      expect(component.formattedTitle()).toEqual({ first: 'Hello', last: '' });
    });

    it('should handle multiple words', () => {
      componentRef.setInput('title', 'Hello Beautiful World');
      fixture.detectChanges();
      expect(component.formattedTitle()).toEqual({ first: 'Hello', last: 'Beautiful World' });
    });
  });

  describe('classes based on size', () => {
    beforeEach(() => {
      componentRef.setInput('title', 'Test');
      fixture.detectChanges();
    });

    it('should default to large classes', () => {
      expect(component.headerClasses()).toBe('mb-16 pt-8');
      expect(component.headingClasses()).toBe(
        'text-6xl md:text-7xl font-extrabold tracking-tighter text-[var(--mat-sys-on-surface)] mat-headline-medium',
      );
      expect(component.dividerClasses()).toBe(
        'h-1.5 w-24 bg-[var(--mat-sys-primary)] mt-6 rounded-full',
      );
    });

    it('should return large classes explicitly', () => {
      componentRef.setInput('size', 'large');
      fixture.detectChanges();
      expect(component.headerClasses()).toBe('mb-16 pt-8');
      expect(component.headingClasses()).toBe(
        'text-6xl md:text-7xl font-extrabold tracking-tighter text-[var(--mat-sys-on-surface)] mat-headline-medium',
      );
      expect(component.dividerClasses()).toBe(
        'h-1.5 w-24 bg-[var(--mat-sys-primary)] mt-6 rounded-full',
      );
    });

    it('should return small classes', () => {
      componentRef.setInput('size', 'small');
      fixture.detectChanges();
      expect(component.headerClasses()).toBe('mb-12');
      expect(component.headingClasses()).toBe(
        'text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--mat-sys-on-surface)] mat-headline-small',
      );
      expect(component.dividerClasses()).toBe(
        'h-1 w-16 bg-[var(--mat-sys-primary)] mt-4 rounded-full',
      );
    });

    it('should return hero classes', () => {
      componentRef.setInput('size', 'hero');
      fixture.detectChanges();
      expect(component.headerClasses()).toBe('');
      expect(component.headingClasses()).toBe(
        'text-3xl md:text-5xl font-bold tracking-tight text-white leading-[0.9] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]',
      );
      expect(component.dividerClasses()).toBe(
        'h-1.5 w-16 bg-[var(--mat-sys-primary)] mt-3 rounded-full',
      );
    });
  });
});
