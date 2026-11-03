import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ApiService } from './api.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [UsersService, { provide: ApiService, useValue: apiMock }],
    });

    service = TestBed.inject(UsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch users from /admin/users', async () => {
    const mockUsers = [{ id: 'u1', email: 'test@example.com' }];
    apiMock.get.mockResolvedValue({ users: mockUsers });

    const result = await service.getUsers();
    expect(apiMock.get).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual(mockUsers);
  });

  it('should fallback to empty array if /admin/users returns empty response', async () => {
    apiMock.get.mockResolvedValue({});
    const result = await service.getUsers();
    expect(result).toEqual([]);
  });

  it('should fetch waiting room from /admin/waiting-room', async () => {
    const mockPending = [{ id: 'u-pend', email: 'pending@example.com' }];
    apiMock.get.mockResolvedValue({ pendingUsers: mockPending });

    const result = await service.getWaitingRoom();
    expect(apiMock.get).toHaveBeenCalledWith('/admin/waiting-room');
    expect(result).toEqual(mockPending);
  });

  it('should fallback to empty array if waiting room returns empty response', async () => {
    apiMock.get.mockResolvedValue({});
    const result = await service.getWaitingRoom();
    expect(result).toEqual([]);
  });

  it('should approve a user via /admin/users/:id/approve', async () => {
    apiMock.post.mockResolvedValue({ success: true, message: 'approved' });

    const payload = {
      role: 'member' as const,
      tenantName: "Chef's Kitchen",
      slug: 'chefs-kitchen',
    };
    const res = await service.approveUser('u1', payload);

    expect(apiMock.post).toHaveBeenCalledWith('/admin/users/u1/approve', payload);
    expect(res.success).toBe(true);
  });

  it('should block a user via /admin/users/:id/block', async () => {
    apiMock.post.mockResolvedValue({ success: true, message: 'blocked' });

    const res = await service.blockUser('u1');
    expect(apiMock.post).toHaveBeenCalledWith('/admin/users/u1/block', {});
    expect(res.success).toBe(true);
  });

  it('should unblock a user via /admin/users/:id/unblock', async () => {
    apiMock.post.mockResolvedValue({ success: true, message: 'unblocked' });

    const res = await service.unblockUser('u1');
    expect(apiMock.post).toHaveBeenCalledWith('/admin/users/u1/unblock', {});
    expect(res.success).toBe(true);
  });

  it('should impersonate a user via /admin/users/:id/impersonate', async () => {
    apiMock.post.mockResolvedValue({ success: true, message: 'impersonating' });

    const res = await service.impersonateUser('u1');
    expect(apiMock.post).toHaveBeenCalledWith('/admin/users/u1/impersonate', {});
    expect(res.success).toBe(true);
  });

  it('should update tenant via /admin/tenants/:id', async () => {
    const tenantPayload = { name: 'Renamed Tenant', slug: 'renamed' };
    apiMock.put.mockResolvedValue({ success: true, tenant: { id: 't1', ...tenantPayload } });

    const res = await service.updateTenant('t1', tenantPayload);
    expect(apiMock.put).toHaveBeenCalledWith('/admin/tenants/t1', tenantPayload);
    expect(res.success).toBe(true);
  });
});
