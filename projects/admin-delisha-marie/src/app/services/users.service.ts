import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { TenantInfo } from './auth.service';

export interface UserProfileItem {
  id: string;
  userId: string;
  email: string;
  role: 'admin' | 'member' | 'unassigned';
  status: 'pending' | 'active' | 'blocked';
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
  tenant: TenantInfo | null;
}

export interface ApproveUserPayload {
  role: 'member' | 'admin';
  tenantName?: string;
  slug?: string;
  customDomain?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  slug?: string;
  customDomain?: string;
  isPublic?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly api = inject(ApiService);

  async getUsers(): Promise<UserProfileItem[]> {
    const res = await this.api.get<{ users: UserProfileItem[] }>('/admin/users');
    return res.users || [];
  }

  async getWaitingRoom(): Promise<UserProfileItem[]> {
    const res = await this.api.get<{ pendingUsers: UserProfileItem[] }>('/admin/waiting-room');
    return res.pendingUsers || [];
  }

  async approveUser(
    id: string,
    payload: ApproveUserPayload,
  ): Promise<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>(
      `/admin/users/${id}/approve`,
      payload,
    );
  }

  async blockUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>(`/admin/users/${id}/block`, {});
  }

  async unblockUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>(`/admin/users/${id}/unblock`, {});
  }

  async impersonateUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>(
      `/admin/users/${id}/impersonate`,
      {},
    );
  }

  async updateTenant(
    tenantId: string,
    payload: UpdateTenantPayload,
  ): Promise<{ success: boolean; tenant: TenantInfo }> {
    return this.api.put<{ success: boolean; tenant: TenantInfo }>(
      `/admin/tenants/${tenantId}`,
      payload,
    );
  }
}
