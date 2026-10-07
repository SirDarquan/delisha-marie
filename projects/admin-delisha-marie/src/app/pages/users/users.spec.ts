import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { UsersService, UserProfileItem } from '../../services/users.service';
import { UsersPageComponent } from './users';

describe('UsersPageComponent', () => {
  let component: UsersPageComponent;
  let fixture: ComponentFixture<UsersPageComponent>;
  let usersServiceMock: {
    getUsers: ReturnType<typeof vi.fn>;
    getWaitingRoom: ReturnType<typeof vi.fn>;
    approveUser: ReturnType<typeof vi.fn>;
    blockUser: ReturnType<typeof vi.fn>;
    unblockUser: ReturnType<typeof vi.fn>;
    impersonateUser: ReturnType<typeof vi.fn>;
    updateTenant: ReturnType<typeof vi.fn>;
  };
  let authMock: { checkSession: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockUsersList: UserProfileItem[] = [
    {
      id: 'p1',
      userId: 'u1',
      email: 'sirdarquan@gmail.com',
      role: 'admin',
      status: 'active',
      createdAt: '2026-10-07T00:00:00Z',
      tenant: null,
    },
    {
      id: 'p2',
      userId: 'u2',
      email: 'chef@example.com',
      role: 'member',
      status: 'active',
      createdAt: '2026-10-07T00:00:00Z',
      tenant: {
        id: 't2',
        name: "Chef's Table",
        slug: 'chefs-table',
        custom_domain: 'chef.delisha-marie.com',
      },
    },
    {
      id: 'p3',
      userId: 'u3',
      email: 'blocked@example.com',
      role: 'member',
      status: 'blocked',
      createdAt: '2026-10-07T00:00:00Z',
      tenant: null,
    },
    {
      id: 'p4',
      userId: 'u4',
      email: 'pending@example.com',
      role: 'unassigned',
      status: 'pending',
      createdAt: '2026-10-07T00:00:00Z',
      tenant: null,
    },
  ];

  const mockPendingList: UserProfileItem[] = [
    {
      id: 'p-new',
      userId: 'u-new',
      email: 'newbie@example.com',
      role: 'unassigned',
      status: 'pending',
      createdAt: '2026-10-07T00:00:00Z',
      tenant: null,
    },
  ];

  beforeEach(async () => {
    usersServiceMock = {
      getUsers: vi.fn().mockResolvedValue(mockUsersList),
      getWaitingRoom: vi.fn().mockResolvedValue(mockPendingList),
      approveUser: vi.fn().mockResolvedValue({ success: true, message: 'Approved' }),
      blockUser: vi.fn().mockResolvedValue({ success: true, message: 'Blocked' }),
      unblockUser: vi.fn().mockResolvedValue({ success: true, message: 'Unblocked' }),
      impersonateUser: vi.fn().mockResolvedValue({ success: true, message: 'Impersonating' }),
      updateTenant: vi.fn().mockResolvedValue({ success: true, tenant: { id: 't2' } }),
    };

    authMock = {
      checkSession: vi.fn().mockResolvedValue(undefined),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        { provide: UsersService, useValue: usersServiceMock },
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and load initial data', async () => {
    expect(component.activeTab()).toBe('all-users');
    await component.loadData();
    fixture.detectChanges();
    expect(component.users()).toEqual(mockUsersList);
    expect(component.pendingUsers()).toEqual(mockPendingList);
    expect(fixture.nativeElement.textContent).toContain('Users & Tenant Management');
  });

  it('should handle loadData failure gracefully', async () => {
    usersServiceMock.getUsers.mockRejectedValue(new Error('Network failure'));
    await component.loadData();
    fixture.detectChanges();
    expect(component.isErrorMessage()).toBe(true);
    expect(component.actionMessage()).toContain('Failed to load users data');
    expect(fixture.nativeElement.textContent).toContain('Failed to load users data');
  });

  it('should toggle approval form with defaults and cancel when clicked again', () => {
    component.pendingUsers.set(mockPendingList);
    component.toggleApproveForm('p-new');

    expect(component.selectedUserIdForApproval()).toBe('p-new');
    expect(component.approvalTenantName).toBe("newbie's Kitchen");
    expect(component.approvalSlug).toBe('newbie');

    component.toggleApproveForm('p-new');
    expect(component.selectedUserIdForApproval()).toBeNull();
  });

  it('should submit member approval successfully', async () => {
    component.approvalTenantName = 'Custom Kitchen';
    component.approvalSlug = 'custom-kitchen';
    component.approvalCustomDomain = 'custom.com';

    await component.submitMemberApproval('p-new');

    expect(usersServiceMock.approveUser).toHaveBeenCalledWith('p-new', {
      role: 'member',
      tenantName: 'Custom Kitchen',
      slug: 'custom-kitchen',
      customDomain: 'custom.com',
    });
    expect(component.actionMessage()).toContain('provisioned successfully');
  });

  it('should handle member approval failure', async () => {
    usersServiceMock.approveUser.mockRejectedValue(new Error('DB Error'));
    await component.submitMemberApproval('p-new');
    expect(component.isErrorMessage()).toBe(true);
    expect(component.actionMessage()).toContain('Failed to approve member');
  });

  it('should approve user as admin when confirmed', async () => {
    await component.onApproveAdmin(mockPendingList[0]);
    expect(usersServiceMock.approveUser).toHaveBeenCalledWith('p-new', { role: 'admin' });
    expect(component.actionMessage()).toContain('approved as Administrator');
  });

  it('should not approve admin if confirm cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await component.onApproveAdmin(mockPendingList[0]);
    expect(usersServiceMock.approveUser).not.toHaveBeenCalled();
  });

  it('should block user when confirmed', async () => {
    await component.onBlockUser(mockUsersList[1]);
    expect(usersServiceMock.blockUser).toHaveBeenCalledWith('p2');
    expect(component.actionMessage()).toContain('has been blocked');
  });

  it('should not block user if confirm cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await component.onBlockUser(mockUsersList[1]);
    expect(usersServiceMock.blockUser).not.toHaveBeenCalled();
  });

  it('should unblock user successfully', async () => {
    await component.onUnblockUser(mockUsersList[2]);
    expect(usersServiceMock.unblockUser).toHaveBeenCalledWith('p3');
    expect(component.actionMessage()).toContain('has been unblocked');
  });

  it('should launch passwordless impersonation and navigate to /recipes', async () => {
    await component.onImpersonate(mockUsersList[1]);
    expect(usersServiceMock.impersonateUser).toHaveBeenCalledWith('p2');
    expect(authMock.checkSession).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('should handle impersonation failure', async () => {
    usersServiceMock.impersonateUser.mockRejectedValue(new Error('Failed OTP'));
    await component.onImpersonate(mockUsersList[1]);
    expect(component.isErrorMessage()).toBe(true);
    expect(component.actionMessage()).toContain('Failed to impersonate');
  });

  it('should open edit tenant modal and save changes', async () => {
    component.openEditTenant(mockUsersList[1]);
    expect(component.editingTenantUser()).toEqual(mockUsersList[1]);
    expect(component.editTenantName).toBe("Chef's Table");

    component.editTenantName = 'Updated Chef Table';
    await component.saveTenantChanges();

    expect(usersServiceMock.updateTenant).toHaveBeenCalledWith('t2', {
      name: 'Updated Chef Table',
      slug: 'chefs-table',
      customDomain: 'chef.delisha-marie.com',
    });
    expect(component.editingTenantUser()).toBeNull();
  });

  it('should handle save tenant changes failure', async () => {
    component.editingTenantUser.set(mockUsersList[1]);
    usersServiceMock.updateTenant.mockRejectedValue(new Error('Update failed'));
    await component.saveTenantChanges();
    expect(component.isErrorMessage()).toBe(true);
    expect(component.actionMessage()).toContain('Failed to update tenant');
  });

  it('should switch tabs between All Users and Waiting Room in template', async () => {
    await component.loadData();
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.border-b button');
    // Button 0: All Users & Tenants, Button 1: Waiting Room
    expect(buttons).toHaveLength(2);

    // Switch to Waiting Room
    buttons[1].click();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('waiting-room');
    expect(fixture.nativeElement.textContent).toContain('newbie@example.com');

    // Switch back to All Users
    buttons[0].click();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('all-users');
    expect(fixture.nativeElement.textContent).toContain('sirdarquan@gmail.com');
  });

  it('should render empty waiting room message when pendingUsers is empty', () => {
    component.activeTab.set('waiting-room');
    component.pendingUsers.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Waiting room is clear!');
  });

  it('should render loading states for tabs', () => {
    component.isLoading.set(true);

    component.activeTab.set('waiting-room');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading pending signups...');

    component.activeTab.set('all-users');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading user directory...');
  });

  it('should render and dismiss action message banner', () => {
    component.actionMessage.set('Test Notification');
    component.isErrorMessage.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Test Notification');
    const alertEl = fixture.nativeElement.querySelector('.bg-emerald-500\\/10');
    const closeBtn = alertEl?.querySelector('button') as HTMLButtonElement;
    closeBtn?.click();
    expect(component.actionMessage()).toBeNull();
  });

  it('should render edit tenant modal and allow editing inputs and cancel', () => {
    component.openEditTenant(mockUsersList[1]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Edit Tenant: Chef's Table");

    // Click Cancel button in modal
    const modalEl = fixture.nativeElement.querySelector('.fixed.inset-0');
    const cancelBtn = modalEl?.querySelector('button.border-slate-700') as HTMLButtonElement;
    cancelBtn?.click();
    expect(component.editingTenantUser()).toBeNull();
  });

  it('should trigger approval and provisioning through template in waiting room', async () => {
    await component.loadData();
    component.activeTab.set('waiting-room');
    fixture.detectChanges();

    // Toggle approve form for newbie
    component.toggleApproveForm('p-new');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Provision Member Tenant Sandbox');

    // Click Confirm & Provision Tenant
    const provisionSpy = vi.spyOn(component, 'submitMemberApproval');
    const confirmBtn = fixture.nativeElement.querySelector(
      'button.bg-gradient-to-r',
    ) as HTMLButtonElement;
    confirmBtn?.click();

    expect(provisionSpy).toHaveBeenCalledWith('p-new');
  });

  it('should trigger onApproveAdmin and onBlockUser from waiting room buttons', () => {
    component.activeTab.set('waiting-room');
    component.pendingUsers.set(mockPendingList);
    fixture.detectChanges();

    const adminSpy = vi.spyOn(component, 'onApproveAdmin');
    const blockSpy = vi.spyOn(component, 'onBlockUser');

    const adminBtn = fixture.nativeElement.querySelector(
      'button.border-indigo-500',
    ) as HTMLButtonElement;
    adminBtn?.click();
    expect(adminSpy).toHaveBeenCalledWith(mockPendingList[0]);

    const blockBtn = fixture.nativeElement.querySelector(
      'button.border-rose-500',
    ) as HTMLButtonElement;
    blockBtn?.click();
    expect(blockSpy).toHaveBeenCalledWith(mockPendingList[0]);
  });

  it('should trigger onImpersonate, openEditTenant, and onUnblockUser from all-users table', () => {
    component.activeTab.set('all-users');
    component.users.set(mockUsersList);
    fixture.detectChanges();

    const impSpy = vi.spyOn(component, 'onImpersonate');
    const editSpy = vi.spyOn(component, 'openEditTenant');
    const unblockSpy = vi.spyOn(component, 'onUnblockUser');

    // Login As button for member
    const loginAsBtn = fixture.nativeElement.querySelector(
      'button.bg-purple-600\\/20',
    ) as HTMLButtonElement;
    loginAsBtn?.click();
    expect(impSpy).toHaveBeenCalledWith(mockUsersList[1]);

    // Edit tenant button
    const editBtn = fixture.nativeElement.querySelector('button.bg-slate-800') as HTMLButtonElement;
    editBtn?.click();
    expect(editSpy).toHaveBeenCalledWith(mockUsersList[1]);

    // Unblock button for blocked user
    const unblockBtn = fixture.nativeElement.querySelector(
      'button.bg-emerald-500\\/10',
    ) as HTMLButtonElement;
    unblockBtn?.click();
    expect(unblockSpy).toHaveBeenCalledWith(mockUsersList[2]);
  });
});
