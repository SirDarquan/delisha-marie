import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarNewsletter } from './sidebar-newsletter';

interface SidebarNewsletterTestInstance {
  userModel: { (): { email: string }; set: (v: { email: string }) => void };
  newsletterForm: () => { invalid: () => boolean; valid: () => boolean };
}

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
    const testInstance = component as unknown as SidebarNewsletterTestInstance;
    const userModel = testInstance.userModel;
    userModel.set({ email: '' });
    fixture.detectChanges();

    expect(testInstance.newsletterForm().invalid()).toBeTruthy();
  });

  it('should have an invalid form when email is not an actual email', () => {
    const testInstance = component as unknown as SidebarNewsletterTestInstance;
    const userModel = testInstance.userModel;
    userModel.set({ email: 'invalid-email' });
    fixture.detectChanges();

    expect(testInstance.newsletterForm().invalid()).toBeTruthy();
  });

  it('should have a valid form when email is correct', () => {
    const testInstance = component as unknown as SidebarNewsletterTestInstance;
    const userModel = testInstance.userModel;
    userModel.set({ email: 'test@example.com' });
    fixture.detectChanges();

    expect(testInstance.newsletterForm().valid()).toBeTruthy();
  });

  it('should call submission action and reset form on valid submission', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation((msg: string) => {
      console.log(msg);
    });

    const testInstance = component as unknown as SidebarNewsletterTestInstance;
    const userModel = testInstance.userModel;
    userModel.set({ email: 'test@example.com' });
    fixture.detectChanges();

    // Trigger submission
    const formElement = fixture.nativeElement.querySelector('form');
    if (formElement) {
      formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    fixture.detectChanges();
    await fixture.whenStable();

    expect(alertSpy).toHaveBeenCalledWith('Thanks for subscribing, test@example.com!');
    expect(userModel().email).toBe('');
    alertSpy.mockRestore();
  });
});
