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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userModel = (component as any).userModel;
    userModel.set({ email: '' });
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).newsletterForm().invalid()).toBeTruthy();
  });

  it('should have an invalid form when email is not an actual email', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userModel = (component as any).userModel;
    userModel.set({ email: 'invalid-email' });
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).newsletterForm().invalid()).toBeTruthy();
  });

  it('should have a valid form when email is correct', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userModel = (component as any).userModel;
    userModel.set({ email: 'test@example.com' });
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((component as any).newsletterForm().valid()).toBeTruthy();
  });

  it('should call submission action and reset form on valid submission', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation((msg: string) => {
      console.log(msg);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userModel = (component as any).userModel;
    userModel.set({ email: 'test@example.com' });
    fixture.detectChanges();

    // Trigger submission
    const formElement = fixture.nativeElement.querySelector('form');
    formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(alertSpy).toHaveBeenCalledWith('Thanks for subscribing, test@example.com!');
    expect(userModel().email).toBe('');
    alertSpy.mockRestore();
  });
});
