import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarNewsletter } from './sidebar-newsletter';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SidebarNewsletter', () => {
  let component: SidebarNewsletter;
  let fixture: ComponentFixture<SidebarNewsletter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarNewsletter],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarNewsletter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when email is empty', () => {
    component.emailControl.setValue('');
    expect(component.emailControl.valid).toBeFalsy();
  });

  it('should have an invalid form when email is not an actual email', () => {
    component.emailControl.setValue('invalid-email');
    expect(component.emailControl.valid).toBeFalsy();
  });

  it('should have a valid form when email is correct', () => {
    component.emailControl.setValue('test@example.com');
    expect(component.emailControl.valid).toBeTruthy();
  });

  it('should call subscribe and reset form on valid submission', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation((message: string) => {
      console.log('Mock Alert:', message);
    });
    component.emailControl.setValue('test@example.com');
    fixture.detectChanges();
    component.subscribe();

    expect(alertSpy).toHaveBeenCalledWith('Thanks for subscribing, test@example.com!');
    expect(component.emailControl.value).toBeNull();
    alertSpy.mockRestore();
  });

  it('should not call alert or reset form on invalid submission', () => {
    const alertSpy = vi.spyOn(window, 'alert');
    component.emailControl.setValue('invalid-email');
    fixture.detectChanges();
    component.subscribe();

    expect(alertSpy).not.toHaveBeenCalled();
    expect(component.emailControl.value).toBe('invalid-email');
  });
});
