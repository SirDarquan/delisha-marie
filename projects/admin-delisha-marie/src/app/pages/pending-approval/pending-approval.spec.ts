import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PendingApprovalComponent } from './pending-approval';

describe('PendingApprovalComponent', () => {
  let component: PendingApprovalComponent;
  let fixture: ComponentFixture<PendingApprovalComponent>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let authMock: {
    checkSession: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    userStatus: ReturnType<typeof vi.fn>;
  };
  const statusSignal = signal<'pending' | 'active' | 'blocked'>('pending');

  beforeEach(async () => {
    routerMock = { navigate: vi.fn() };
    statusSignal.set('pending');
    authMock = {
      checkSession: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      userStatus: vi.fn().mockImplementation(() => statusSignal()),
    };

    await TestBed.configureTestingModule({
      imports: [PendingApprovalComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and render template', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Approval Pending');
  });

  it('should navigate to home if checkStatus detects user became active', async () => {
    authMock.checkSession.mockImplementation(async () => {
      statusSignal.set('active');
    });

    await component.checkStatus();
    expect(authMock.checkSession).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should set blocked message if user status is blocked', async () => {
    authMock.checkSession.mockImplementation(async () => {
      statusSignal.set('blocked');
    });

    await component.checkStatus();
    fixture.detectChanges();
    expect(component.statusMessage()).toContain('blocked');
    expect(fixture.nativeElement.textContent).toContain('Your account has been blocked');
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should set pending message if user status remains pending', async () => {
    await component.checkStatus();
    fixture.detectChanges();
    expect(component.statusMessage()).toContain('still pending approval');
    expect(fixture.nativeElement.textContent).toContain('still pending approval');
  });

  it('should handle checkStatus error gracefully', async () => {
    authMock.checkSession.mockRejectedValue(new Error('Network error'));
    await component.checkStatus();
    fixture.detectChanges();
    expect(component.statusMessage()).toContain('Unable to check status');
    expect(fixture.nativeElement.textContent).toContain('Unable to check status');
  });

  it('should log out and navigate to login', () => {
    component.onLogout();
    expect(authMock.logout).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should trigger checkStatus and onLogout from template buttons', () => {
    const checkSpy = vi.spyOn(component, 'checkStatus');
    const logoutSpy = vi.spyOn(component, 'onLogout');

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    expect(checkSpy).toHaveBeenCalled();

    buttons[1].click();
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should show Checking Status... text while isChecking is true', () => {
    component.isChecking.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Checking Status...');
  });
});
